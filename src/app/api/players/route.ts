import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const paths = [
    path.join(process.cwd(), 'public', 'data', 'players.json'),
    path.join(process.cwd(), '..', 'data', 'players.json'),
  ];
  for (const filePath of paths) {
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(raw);
      return NextResponse.json(data);
    } catch {}
  }
  return NextResponse.json({ error: 'Failed to load players' }, { status: 500 });
}
