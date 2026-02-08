import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { id, type, action } = body as {
    id: string;
    type: 'content' | 'email';
    action: 'approve' | 'reject';
  };

  if (!id || !type || !action) {
    return NextResponse.json({ error: 'Missing id, type, or action' }, { status: 400 });
  }

  const db = getDb();

  if (type === 'content') {
    const newStatus = action === 'approve' ? 'ready' : 'rejected';
    db.prepare('UPDATE content_posts SET status = ? WHERE id = ? AND status = ?')
      .run(newStatus, id, 'pending_approval');
  } else if (type === 'email') {
    const newStatus = action === 'approve' ? 'approved' : 'cancelled';
    db.prepare('UPDATE sequences SET status = ? WHERE id = ? AND status = ?')
      .run(newStatus, id, 'pending_approval');
  }

  // Log the action
  db.prepare('INSERT INTO activity_log (ts, action, detail, result) VALUES (datetime(\'now\'), ?, ?, ?)')
    .run(
      action === 'approve' ? 'approve' : 'reject',
      `${action === 'approve' ? 'Approved' : 'Rejected'} ${type}: ${id}`,
      action === 'approve' ? 'Moved to ready/approved' : 'Rejected/cancelled',
    );

  return NextResponse.json({ ok: true, id, action });
}
