import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';



interface UploadBody {
  playerId: string;
  nickname: string;
  pg: any;
  sg: any;
  sf: any;
  pf: any;
  c: any;
  score: number;
  avgStats: Record<string, number>;
}

function loadPlayersMap(): Map<number, any> {
  const paths = [
    path.join(process.cwd(), 'public', 'data', 'players.json'),
    path.join(process.cwd(), '..', 'data', 'players.json'),
  ];
  for (const p of paths) {
    try {
      const raw = fs.readFileSync(p, 'utf-8');
      const data = JSON.parse(raw);
      const players = data.players || data;
      const map = new Map<number, any>();
      for (const pl of players) map.set(pl.id, pl);
      return map;
    } catch {}
  }
  return new Map();
}

function validateAndRecalcScore(lineup: Record<string, any>, playersMap: Map<number, any>): number | null {
  const positions = ['PG', 'SG', 'SF', 'PF', 'C'];
  const validated: any[] = [];

  for (const pos of positions) {
    const card = lineup[pos];
    if (!card) return null;
    const real = playersMap.get(card.id);
    if (!real) return null;
    // Use server-side data for ovr to prevent cheating
    validated.push(real);
  }

  // Recalculate score server-side
  const baseOvr = validated.reduce((sum, p) => sum + p.ovr, 0);
  const teams = validated.map((p: any) => p.team);
  const teamCounts: Record<string, number> = {};
  teams.forEach((t: string) => { teamCounts[t] = (teamCounts[t] || 0) + 1; });
  let chemBonus = 0;
  Object.values(teamCounts).forEach(count => {
    if (count >= 3) chemBonus += 8;
    else if (count >= 2) chemBonus += 5;
  });

  return Math.round(baseOvr * (1 + chemBonus / 100) * 100) / 100;
}

export async function POST(req: NextRequest) {
  try {
    const body: UploadBody = await req.json();
    const { playerId, nickname, pg, sg, sf, pf, c, score, avgStats } = body;

    if (!playerId || !nickname || !pg || !sg || !sf || !pf || !c) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (nickname.length > 32 || nickname.length < 2) {
      return NextResponse.json({ error: 'Nickname must be 2-32 characters' }, { status: 400 });
    }

    // Check nickname uniqueness
    const { data: existing } = await getSupabase()
      .from('players_identity')
      .select('id')
      .eq('nickname', nickname)
      .single();

    if (existing && existing.id !== playerId) {
      return NextResponse.json({ error: 'Nickname already taken' }, { status: 409 });
    }

    // Validate score server-side
    const playersMap = loadPlayersMap();
    const lineupData = { PG: pg, SG: sg, SF: sf, PF: pf, C: c };
    const serverScore = validateAndRecalcScore(lineupData, playersMap);
    if (serverScore === null) {
      return NextResponse.json({ error: 'Invalid lineup data' }, { status: 400 });
    }

    // Upsert identity
    await getSupabase()
      .from('players_identity')
      .upsert({ id: playerId, nickname }, { onConflict: 'id' });

    // Deactivate old lineups
    await getSupabase()
      .from('lineups')
      .update({ is_active: false })
      .eq('player_id', playerId);

    // Insert lineup
    const { data: lineupRow, error: insertError } = await getSupabase()
      .from('lineups')
      .insert({
        player_id: playerId,
        nickname,
        pg_data: pg,
        sg_data: sg,
        sf_data: sf,
        pf_data: pf,
        c_data: c,
        score: serverScore,
        avg_stats: avgStats,
        is_active: true,
      })
      .select('id')
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Upsert player_stats
    const { data: existingStats } = await getSupabase()
      .from('player_stats')
      .select('best_score')
      .eq('player_id', playerId)
      .single();

    if (existingStats) {
      const newBest = Math.max(existingStats.best_score, serverScore);
      await getSupabase()
        .from('player_stats')
        .update({ best_score: newBest, nickname })
        .eq('player_id', playerId);
    } else {
      await getSupabase()
        .from('player_stats')
        .insert({ player_id: playerId, nickname, best_score: serverScore });
    }

    return NextResponse.json({ lineupId: lineupRow.id, score: serverScore });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
