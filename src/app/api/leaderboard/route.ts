import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';



export async function GET() {
  try {
    const { data, error } = await getSupabase()
      .from('player_stats')
      .select('player_id, nickname, wins, losses, draws, total_battles, best_score')
      .gt('total_battles', 0)
      .order('wins', { ascending: false })
      .order('best_score', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const leaderboard = (data || []).map((entry: any) => ({
      ...entry,
      win_rate: entry.total_battles > 0
        ? Math.round(entry.wins / entry.total_battles * 1000) / 10
        : 0,
    }));

    return NextResponse.json({ leaderboard });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
