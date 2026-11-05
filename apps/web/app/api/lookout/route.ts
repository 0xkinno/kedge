import { twinOf, ss58 } from '@/lib/kedge/twin';
import { attempts, friendGroups, inheritor, delayClock } from '@/lib/kedge/lookout';
import { withApi, json } from '@/lib/server';
import { isAddress } from 'ethers';
export const dynamic = 'force-dynamic'; export const maxDuration = 30;
export async function GET(req: Request) {
  const lost = new URL(req.url).searchParams.get('lost') ?? '';
  if (!isAddress(lost)) return json({ error: 'lost must be an EVM address' }, 400);
  const l32 = twinOf(lost);
  const { head, groups, att, heir } = await withApi(async (a) => { const head = (await a.rpc.chain.getHeader()).number.toNumber(); const [groups, att, heir] = await Promise.all([friendGroups(a, l32), attempts(a, l32), inheritor(a, l32)]); return { head, groups, att, heir }; });
  return json({ lost, lostTwin: ss58(l32), head, groups, inheritor: heir,
    attempts: att.map((x) => ({ ...x, clock: groups[x.groupIndex] ? delayClock(x.initBlock, Number(groups[x.groupIndex].inheritanceDelay), head) : null })) });
}
