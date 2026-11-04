// EIP-191 signed subscription. No signature, no subscription.
import { verifySubscription } from '../../../../../watch/core.mjs';
import { twinOf, ss58 } from '@/lib/kedge/twin';
import { json, store } from '@/lib/server';
export const dynamic = 'force-dynamic';
export async function POST(req: Request) {
  let b: any; try { b = await req.json(); } catch { return json({ error: 'invalid json' }, 400); }
  try { verifySubscription(b); } catch (e: any) { return json({ error: String(e.message) }, 401); }
  const lostSs58 = ss58(twinOf(b.address));
  await store.set(`kedge:sub:${lostSs58}`, JSON.stringify({ address: b.address, chatId: String(b.chatId), lostSs58, at: new Date().toISOString() }));
  return json({ subscribed: true, lost: lostSs58 });
}
