import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();

  const seedCount = (db.prepare(
    'SELECT COUNT(*) as c FROM seed_registry'
  ).get() as { c: number })?.c ?? 0;

  // Per-table breakdown
  const breakdown = db.prepare(
    'SELECT table_name, COUNT(*) as c FROM seed_registry GROUP BY table_name ORDER BY c DESC'
  ).all() as { table_name: string; c: number }[];

  return NextResponse.json({
    has_seed_data: seedCount > 0,
    seed_count: seedCount,
    breakdown,
  });
}
