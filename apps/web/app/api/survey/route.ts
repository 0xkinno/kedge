// Surveyor: inventory the lost account and dry-run each sweep item. Returns the encoded rescue call; it never signs.
import { twinOf } from '@/lib/kedge/twin';
import { inventory, plan } from '@/lib/kedge/survey';
import { bringHome } from '@/lib/kedge/purser';
import { withApi, evmProvider, json } from '@/lib/server';
import { isAddress } from 'ethers';
export const dynamic = 'force-dynamic'; export const maxDuration = 60;
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams; const lost = q.get('lost') ?? ''; const dest = q.get('dest') ?? '';
  if (!isAddress(lost) || !isAddress(dest)) return json({ error: 'lost and dest must be EVM addresses' }, 400);
  const l32 = twinOf(lost), d32 = twinOf(dest);
  return withApi(async (a) => {
    const inv = await inventory(a, l32, lost, (to, data) => evmProvider.call({ to, data }));
    const lines = await plan(a, l32, d32, dest, inv);
    const items = lines.filter((l) => l.willMove).map((l) => l.item!);
    return json({ inventory: inv, plan: lines.map(({ item, ...l }) => l), callHex: items.length ? await bringHome(l32, d32, items) : null });
  });
}
