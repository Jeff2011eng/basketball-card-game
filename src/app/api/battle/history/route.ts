import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';



export async function GET(req: NextRequest) {
  try {
    const playerId = req.nextUrl.searchParams.get('playerId');
    if (!playerId) {
      return NextResponse.json({ error: 'Missing playerId' }, { status: 400 });
    }

    const { data, error } = await getSupabase()
      .from('battles')
      .select('id, challenger_nickname, defender_nickname, challenger_score, defender_score, winner, created_at')
      .eq('challenger_id', playerId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ history: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
