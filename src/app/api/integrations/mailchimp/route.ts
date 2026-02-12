import { NextResponse } from 'next/server';

// Server-only env var (preferred). Keep NEXT_PUBLIC_* as back-compat fallback.
const apiKey = process.env.MAILCHIMP_API_KEY || process.env.NEXT_PUBLIC_MAILCHIMP_API_KEY;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getDataCenter(key?: string) {
  if (!key) return null;
  const parts = key.split('-');
  return parts.length > 1 ? parts[1] : null;
}

export async function GET() {
  if (!apiKey) {
    return NextResponse.json({ enabled: false, error: 'Missing Mailchimp API key' });
  }

  const dc = getDataCenter(apiKey);
  if (!dc) {
    return NextResponse.json({ enabled: true, ok: false, error: 'Invalid Mailchimp API key format' });
  }

  try {
    const res = await fetch(`https://${dc}.api.mailchimp.com/3.0/lists?count=5`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`anystring:${apiKey}`).toString('base64')}`,
      },
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      return NextResponse.json({ enabled: true, ok: false, error: `Mailchimp HTTP ${res.status}` });
    }

    const json: unknown = await res.json();
    const rawLists: unknown[] =
      isRecord(json) && Array.isArray(json.lists) ? (json.lists as unknown[]) : [];

    const lists = rawLists
      .map((list) => {
        if (!isRecord(list)) return null;
        const stats = isRecord(list.stats) ? list.stats : null;
        return {
          id: typeof list.id === 'string' ? list.id : String(list.id ?? ''),
          name: typeof list.name === 'string' ? list.name : '(unnamed)',
          members: typeof stats?.member_count === 'number' ? stats.member_count : 0,
          unsubscribed: typeof stats?.unsubscribe_count === 'number' ? stats.unsubscribe_count : 0,
          cleaned: typeof stats?.cleaned_count === 'number' ? stats.cleaned_count : 0,
        };
      })
      .filter((x): x is NonNullable<typeof x> => !!x && !!x.id);

    const totals = lists.reduce((acc, l) => {
      acc.members += l.members;
      acc.unsubscribed += l.unsubscribed;
      acc.cleaned += l.cleaned;
      return acc;
    }, { members: 0, unsubscribed: 0, cleaned: 0 });

    return NextResponse.json({ enabled: true, ok: true, count: lists.length, totals, lists });
  } catch (error) {
    return NextResponse.json({ enabled: true, ok: false, error: String(error) });
  }
}

