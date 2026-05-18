import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), '..', 'data', 'players.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    return NextResponse.json(data);
  } catch (e) {
    // fallback: try from project root
    try {
      const filePath = path.join(process.cwd(), 'public', 'data', 'players.json');
      const raw = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(raw);
      return NextResponse.json(data);
    } catch (e2) {
      return NextResponse.json({ error: 'Failed to load players' }, { status: 500 });
    }
  }
}
