import { NextResponse } from 'next/server';
import { ImapFlow } from 'imapflow';
import { requireApiUser } from '@/lib/api-auth';

// Server-only env vars (preferred). Keep NEXT_PUBLIC_* as back-compat fallback,
// but avoid using NEXT_PUBLIC_* for secrets in new deployments.
const user = process.env.EMAIL_USER || process.env.NEXT_PUBLIC_EMAIL_USER;
const pass = process.env.EMAIL_PASSWORD || process.env.NEXT_PUBLIC_EMAIL_PASSWORD;

export async function GET(request: Request) {
  const auth = requireApiUser(request);
  if (auth) return auth;
  if (!user || !pass) {
    return NextResponse.json({ enabled: false, error: 'Missing Gmail credentials' });
  }

  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: { user, pass },
  });

  try {
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');
    try {
      const status = await client.status('INBOX', { messages: true, unseen: true });
      return NextResponse.json({
        enabled: true,
        ok: true,
        messages: status.messages ?? 0,
        unseen: status.unseen ?? 0,
        checked_at: new Date().toISOString(),
      });
    } finally {
      lock.release();
    }
  } catch (error) {
    return NextResponse.json({ enabled: true, ok: false, error: String(error) });
  } finally {
    try {
      await client.logout();
    } catch {
      // ignore
    }
  }
}
