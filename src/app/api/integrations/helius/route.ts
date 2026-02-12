import { NextResponse } from 'next/server';

// Server-only env var (preferred). Keep NEXT_PUBLIC_* as back-compat fallback.
const heliusUrl = process.env.HELIUS_URL || process.env.NEXT_PUBLIC_HELIUS_URL;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function rpc(method: string, params: unknown[] = []): Promise<unknown> {
  if (!heliusUrl) return null;
  const res = await fetch(heliusUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    next: { revalidate: 30 },
  });
  return res.json();
}

export async function GET() {
  if (!heliusUrl) {
    return NextResponse.json({ enabled: false, error: 'Missing Helius URL' });
  }

  try {
    const [health, slot] = await Promise.all([rpc('getHealth'), rpc('getSlot')]);

    const healthResult = isRecord(health) ? health.result : null;
    const slotResult = isRecord(slot) ? slot.result : null;

    return NextResponse.json({
      enabled: true,
      ok: healthResult === 'ok',
      health: healthResult ?? null,
      slot: slotResult ?? null,
      checked_at: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ enabled: true, ok: false, error: String(error) });
  }
}

