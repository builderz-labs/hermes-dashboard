import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/api-auth';

const OLLAMA_BASE_URL = (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/+$/, '');
const OLLAMA_TAGS = `${OLLAMA_BASE_URL}/api/tags`;
const OLLAMA_PS = `${OLLAMA_BASE_URL}/api/ps`;
const REQUIRED = ['qwen2.5-coder:7b', 'qwen2.5-coder:14b', 'deepseek-r1:14b', 'phi4:latest'];

async function fetchWithTimeout(url: string, ms: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request: Request) {
  const auth = requireApiUser(request);
  if (auth) return auth;
  try {
    const [tagsRes, psRes] = await Promise.all([
      fetchWithTimeout(OLLAMA_TAGS, 2000),
      fetchWithTimeout(OLLAMA_PS, 2000),
    ]);

    if (!tagsRes.ok) {
      return NextResponse.json({ ok: false, error: `Ollama HTTP ${tagsRes.status}` }, { status: 200 });
    }

    const tags = await tagsRes.json() as { models?: { name: string }[] };
    const models = (tags.models || []).map((m) => m.name);
    const missing = REQUIRED.filter((r) => !models.includes(r));

    let running: { name: string; expires_at?: string }[] = [];
    if (psRes.ok) {
      const ps = await psRes.json() as { models?: { name: string; expires_at?: string }[] };
      running = (ps.models || []).map((m) => ({ name: m.name, expires_at: m.expires_at }));
    }

    return NextResponse.json({
      ok: true,
      models,
      required: REQUIRED,
      missing,
      count: models.length,
      running,
      warm_count: running.length,
      checked_at: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 200 });
  }
}
