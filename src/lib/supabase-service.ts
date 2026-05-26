import { getSupabase } from './supabase';
import { Lineup, LeaderboardEntry, BattleHistoryEntry } from './types';
import { calcLineupScore } from './game-logic';
import { resolveBattle, BattleResult } from './battle-logic';

export async function uploadLineup(
  playerId: string,
  nickname: string,
  lineup: Lineup,
): Promise<{ lineupId: string; score: number }> {
  const sb = getSupabase();
  const score = calcLineupScore(lineup);
  const players = Object.values(lineup).filter(Boolean);
  const STAT_KEYS = ['SHO', 'SLA', 'DEF', 'ATH', 'PLM', 'PHY', 'REB', 'CLU'] as const;
  const avgStats: Record<string, number> = {};
  for (const key of STAT_KEYS) {
    avgStats[key] = Math.round(players.reduce((s, p) => s + (p!.stats[key]), 0) / players.length * 10) / 10;
  }

  // Check nickname uniqueness
  const { data: existing, error: nickError } = await sb
    .from('players_identity')
    .select('id')
    .eq('nickname', nickname)
    .maybeSingle();

  if (nickError) throw new Error(`Nickname check failed: ${nickError.message}`);

  if (existing && existing.id !== playerId) {
    throw new Error('该昵称已被使用');
  }

  // Upsert identity
  await sb.from('players_identity').upsert({ id: playerId, nickname }, { onConflict: 'id' });

  // Deactivate old lineups
  await sb.from('lineups').update({ is_active: false }).eq('player_id', playerId);

  // Insert lineup
  const { data: row, error } = await sb.from('lineups').insert({
    player_id: playerId,
    nickname,
    pg_data: lineup.PG,
    sg_data: lineup.SG,
    sf_data: lineup.SF,
    pf_data: lineup.PF,
    c_data: lineup.C,
    score,
    avg_stats: avgStats,
    is_active: true,
  }).select('id').single();

  if (error) throw new Error(error.message);

  // Upsert player_stats
  const { data: stats } = await sb.from('player_stats').select('best_score').eq('player_id', playerId).single();
  if (stats) {
    const newBest = Math.max(stats.best_score, score);
    await sb.from('player_stats').update({ best_score: newBest, nickname }).eq('player_id', playerId);
  } else {
    await sb.from('player_stats').insert({ player_id: playerId, nickname, best_score: score });
  }

  return { lineupId: row.id, score };
}

export async function matchmake(
  playerId: string,
  lineupId: string,
): Promise<BattleResult> {
  const sb = getSupabase();

  // Check play count limit (3 times)
  const { data: statsCheck } = await sb.from('player_stats').select('total_battles').eq('player_id', playerId).maybeSingle();
  if (statsCheck && statsCheck.total_battles >= 3) {
    throw new Error('你已用完 3 次游戏机会');
  }

  // Fetch challenger lineup
  const { data: challenger } = await sb.from('lineups').select('*').eq('id', lineupId).single();
  if (!challenger) throw new Error('Lineup not found');

  // Find opponent with progressive score window
  let defender: any = null;
  for (const window of [15, 30, 100, 500]) {
    const { data } = await sb
      .from('lineups')
      .select('*')
      .eq('is_active', true)
      .neq('player_id', playerId)
      .gte('score', challenger.score - window)
      .lte('score', challenger.score + window)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) { defender = data; break; }
  }

  if (!defender) throw new Error('No opponents available yet. Try again later!');

  // Build lineups
  const cL: Lineup = { PG: challenger.pg_data, SG: challenger.sg_data, SF: challenger.sf_data, PF: challenger.pf_data, C: challenger.c_data };
  const dL: Lineup = { PG: defender.pg_data, SG: defender.sg_data, SF: defender.sf_data, PF: defender.pf_data, C: defender.c_data };

  const battleId = crypto.randomUUID();
  const result = resolveBattle(cL, dL, challenger.nickname, defender.nickname, battleId);

  // Save battle
  await sb.from('battles').insert({
    id: battleId,
    challenger_id: playerId,
    challenger_nickname: challenger.nickname,
    challenger_lineup_id: challenger.id,
    defender_lineup_id: defender.id,
    defender_nickname: defender.nickname,
    challenger_score: result.challengerScore,
    defender_score: result.defenderScore,
    challenger_stats: result.statComparison.map(s => ({ stat: s.stat, challenger: s.challenger })),
    defender_stats: result.statComparison.map(s => ({ stat: s.stat, defender: s.defender })),
    winner: result.winner,
    score_diff: result.scoreDiff,
  });

  // Update player_stats
  await updateStats(playerId, result.winner === 'challenger');
  await updateStats(defender.player_id, result.winner === 'defender');

  return result;
}

async function updateStats(playerId: string, isWin: boolean) {
  const sb = getSupabase();
  const { data: existing } = await sb.from('player_stats').select('*').eq('player_id', playerId).single();
  if (existing) {
    const updates: any = { total_battles: existing.total_battles + 1 };
    if (isWin) updates.wins = existing.wins + 1;
    else updates.losses = existing.losses + 1;
    await sb.from('player_stats').update(updates).eq('player_id', playerId);
  } else {
    await sb.from('player_stats').insert({
      player_id: playerId, nickname: '',
      wins: isWin ? 1 : 0, losses: isWin ? 0 : 1, total_battles: 1,
    });
  }
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('player_stats')
    .select('player_id, nickname, wins, losses, draws, total_battles, best_score')
    .gt('total_battles', 0)
    .order('wins', { ascending: false })
    .order('best_score', { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  return (data || []).map((e: any) => ({
    ...e,
    win_rate: e.total_battles > 0 ? Math.round(e.wins / e.total_battles * 1000) / 10 : 0,
  }));
}

export async function fetchBattleHistory(playerId: string): Promise<BattleHistoryEntry[]> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('battles')
    .select('id, challenger_nickname, defender_nickname, challenger_score, defender_score, winner, created_at')
    .eq('challenger_id', playerId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw new Error(error.message);
  return data || [];
}

export async function fetchMyLineup(playerId: string): Promise<Lineup | null> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('lineups')
    .select('pg_data, sg_data, sf_data, pf_data, c_data')
    .eq('player_id', playerId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return { PG: data.pg_data, SG: data.sg_data, SF: data.sf_data, PF: data.pf_data, C: data.c_data };
}
