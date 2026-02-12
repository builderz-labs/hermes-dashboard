import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/api-auth';
import { getDefaultInstanceId, getInstances } from '@/lib/instances';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = requireApiUser(request);
  if (auth) return auth;
  return NextResponse.json({
    default_instance: getDefaultInstanceId(),
    // Do not leak server filesystem paths (openclawHome) to the client.
    instances: getInstances().map((it) => ({ id: it.id, label: it.label })),
  });
}
