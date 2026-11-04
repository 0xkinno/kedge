import { resolveOutcome } from '@/lib/kedge/helm';
import { chainApi, evmRpc, json } from '@/lib/server';
export const dynamic = 'force-dynamic'; export const maxDuration = 60;
export async function GET(req: Request) {
  const hash = new URL(req.url).searchParams.get('hash') ?? '';
  if (!/^0x[0-9a-fA-F]{64}$/.test(hash)) return json({ error: 'hash must be a 32-byte hex string' }, 400);
  try { return json(await resolveOutcome(await chainApi(), evmRpc, hash.toLowerCase(), 20_000)); }
  catch (e: any) { return json({ error: String(e?.message ?? e) }, 504); }
}
