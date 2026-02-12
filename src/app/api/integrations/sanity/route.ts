import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/api-auth';

// Server-only env vars (preferred). Keep NEXT_PUBLIC_* as back-compat fallback.
const projectId = process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET;
const apiVersion = process.env.SANITY_API_VERSION || process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2022-11-15';
const token = process.env.SANITY_API_TOKEN;

const TYPES = ['post', 'article', 'blogPost', 'blog', 'content', 'page'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function buildUrl() {
  if (!projectId || !dataset) return null;
  const query = `*[_type in ${JSON.stringify(TYPES)}] | order(_updatedAt desc)[0...5]{_id,_type,title,slug,updatedAt:_updatedAt,publishedAt}`;
  const encoded = encodeURIComponent(query);
  return `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?query=${encoded}`;
}

export async function GET(request: Request) {
  const auth = requireApiUser(request);
  if (auth) return auth;
  if (!projectId || !dataset) {
    return NextResponse.json({ enabled: false, error: 'Missing Sanity configuration' });
  }

  const url = buildUrl();
  if (!url) return NextResponse.json({ enabled: false, error: 'Invalid Sanity configuration' });

  try {
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      return NextResponse.json({ enabled: true, ok: false, error: `Sanity HTTP ${res.status}` });
    }

    const json: unknown = await res.json();
    const rawItems: unknown[] =
      isRecord(json) && Array.isArray(json.result) ? (json.result as unknown[]) : [];

    const items = rawItems
      .map((item) => {
        if (!isRecord(item)) return null;
        const slug = isRecord(item.slug) ? item.slug : null;
        const id = typeof item._id === 'string' ? item._id : String(item._id ?? '');
        if (!id) return null;
        return {
          id,
          type: typeof item._type === 'string' ? item._type : 'unknown',
          title: typeof item.title === 'string' && item.title.trim() ? item.title : '(untitled)',
          slug: typeof slug?.current === 'string' ? slug.current : null,
          updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : null,
          publishedAt: typeof item.publishedAt === 'string' ? item.publishedAt : null,
        };
      })
      .filter((x): x is NonNullable<typeof x> => !!x);

    return NextResponse.json({ enabled: true, ok: true, count: items.length, items });
  } catch (error) {
    return NextResponse.json({ enabled: true, ok: false, error: String(error) });
  }
}
