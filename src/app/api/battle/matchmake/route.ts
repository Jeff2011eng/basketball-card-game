import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { resolveBattle } from '@/lib/battle-logic';
import { Lineup } from '@/lib/types';



export async function POST(req: NextRequest) {
  try {
    const { lineupId, playerId } = await req.json();
    if (!lineupId || !playerId) {
      return NextResponse.json({ error: 'Missing lineupId or playerId' }, { status: 400 });
    }

    // Fetch challenger lineup
    const { data: challengerLineup, error: fetchError } = await getSupabase()
      .from('lineups')
      .select('*')
      .eq('id', lineupId)
      .single();

    if (fetchError || !challengerLineup) {
      return NextResponse.json({ error: 'Lineup not found' }, { status: 404 });
    }

    // Matchmaking: find closest score opponent, widen window progressively
    let defenderLineup = null;
    for (const window of [15, 30, 100, 500]) {
      const { data } = await getSupabase()
        .from('lineups')
        .select('*')
        .eq('is_active', true)
        .neq('player_id', playerId)
        .gte('score', challengerLineup.score - window)
        .lte('score', challengerLineup.score + window)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        defenderLineup = data;
        break;
      }
    }

    if (!defenderLineup) {
      return NextResponse.json({ error: 'No opponents available yet. Try again later!' }, { status: 404 });
    }

    // Build Lineup objects
    const challengerL: Lineup = {
      PG: challengerLineup.pg_data,
      SG: challengerLineup.sg_data,
      SF: challengerLineup.sf_data,
      PF: challengerLineup.pf_data,
      C: challengerLineup.c_data,
    };
    const defenderL: Lineup = {
      PG: defenderLineup.pg_data,
      SG: defenderLineup.sg_data,
      SF: defenderLineup.sf_data,
      PF: defenderLineup.pf_data,
      C: defenderLineup.c_data,
    };

    const battleId = crypto.randomUUID();
    const result = resolveBattle(
      challengerL, defenderL,
      challengerLineup.nickname, defenderLineup.nickname,
      battleId,
    );

    // Insert battle record
    const { error: battleError } = await getSupabase().from('battles').insert({
      id: battleId,
      challenger_id: playerId,
      challenger_nickname: challengerLineup.nickname,
      challenger_lineup_id: challengerLineup.id,
      defender_lineup_id: defenderLineup.id,
      defender_nickname: defenderLineup.nickname,
      challenger_score: result.challengerScore,
      defender_score: result.defenderScore,
      challenger_stats: result.statComparison.map(s => ({ stat: s.stat, challenger: s.challenger })),
      defender_stats: result.statComparison.map(s => ({ stat: s.stat, defender: s.defender })),
      winner: result.winner,
      score_diff: result.scoreDiff,
    });

    if (battleError) {
      return NextResponse.json({ error: battleError.message }, { status: 500 });
    }

    // Update player_stats for both players
    await updatePlayerStats(playerId, result.winner === 'challenger');
    await updatePlayerStats(defenderLineup.player_id, result.winner === 'defender');

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function updatePlayerStats(playerId: string, isWin: boolean) {
  const { data: existing } = await getSupabase()
    .from('player_stats')
    .select('*')
    .eq('player_id', playerId)
    .single();

  if (existing) {
    const updates: any = {
      total_battles: existing.total_battles + 1,
    };
    if (isWin) updates.wins = existing.wins + 1;
    else updates.losses = existing.losses + 1;
    await getSupabase().from('player_stats').update(updates).eq('player_id', playerId);
  } else {
    await getSupabase().from('player_stats').insert({
      player_id: playerId,
      nickname: '',
      wins: isWin ? 1 : 0,
      losses: isWin ? 0 : 1,
      total_battles: 1,
    });
  }
}
