// Watchkeeper core. Pure functions, no keys, no network. The job (run.mjs) and /api/watch both import this.
import { verifyMessage } from 'ethers';

export const subscriptionMessage = (address, chatId, nonce) => `kedge/watch/v1:${address.toLowerCase()}:${chatId}:${nonce}`;

/** No signature, no subscription. Returns the recovered address or throws. */
export function verifySubscription({ address, chatId, nonce, signature }) {
  if (!address || !chatId || !nonce || !signature) throw new Error('unsigned: address, chatId, nonce and signature are all required');
  if (!/^\d{3,20}$/.test(String(chatId)) && !/^-\d{3,20}$/.test(String(chatId))) throw new Error('bad chat id');
  const rec = verifyMessage(subscriptionMessage(address, chatId, nonce), signature);
  if (rec.toLowerCase() !== address.toLowerCase()) throw new Error('signature does not match address');
  return rec;
}

/** events: [{ block, index, section, method, data }] with ss58 strings in data. subs: Map lostSs58 -> { chatId, address }. */
export function alertsFromEvents(events, subs, finishableAtBlockFor = () => null) {
  const out = [];
  for (const e of events) {
    if (e.section !== 'recovery') continue;
    const lost = e.data.lost ?? e.data.recovered; const sub = subs.get(lost);
    if (!sub) continue;
    const id = `${e.block}:${e.index}`; const gi = Number(e.data.friendGroupIndex ?? e.data.friend_group_index);
    if (e.method === 'AttemptInitiated') out.push({ id, kind: 'initiated', chatId: sub.chatId, lost, initiator: e.data.initiator, group: gi, block: e.block, finishableAtBlock: finishableAtBlockFor(lost, gi, e.block) });
    else if (e.method === 'AttemptFinished') out.push({ id, kind: 'finished', chatId: sub.chatId, lost, inheritor: e.data.inheritor, group: gi, block: e.block });
    else if (e.method === 'RecoveredAccountControlled') out.push({ id, kind: 'controlled', chatId: sub.chatId, lost, inheritor: e.data.inheritor, block: e.block });
  }
  return out;
}

export function formatAlert(a, appUrl, blockSeconds = 6, headBlock = null) {
  const short = (s) => `${s.slice(0, 6)}...${s.slice(-4)}`;
  if (a.kind === 'initiated') {
    const eta = a.finishableAtBlock && headBlock ? ` It becomes finishable at block ${a.finishableAtBlock}, about ${Math.max(0, (a.finishableAtBlock - headBlock) * blockSeconds)} seconds from now.` : '';
    return `Kedge: a recovery attempt started on your wallet ${short(a.lost)}.\nStarted by ${short(a.initiator)}, group ${a.group}, block ${a.block}.${eta}\nIf this was not you or your crew, stop it: ${appUrl}/harbour?act=stop\nTo punish the starter: ${appUrl}/harbour?act=slash`;
  }
  if (a.kind === 'finished') return `Kedge: a recovery attempt on ${short(a.lost)} finished. The new inheritor is ${short(a.inheritor)} (block ${a.block}).`;
  return `Kedge: the inheritor ${short(a.inheritor)} just acted on ${short(a.lost)} (block ${a.block}). Open ${appUrl}/proof to read the result.`;
}

/** Interruption budget: one message per event id, ever. */
export async function deliver(alerts, store, sink, appUrl, headBlock) {
  let sent = 0;
  for (const a of alerts) {
    if (!(await store.setNx(`kedge:sent:${a.id}:${a.kind}`, '1'))) continue;
    await sink({ chatId: a.chatId, text: formatAlert(a, appUrl, 6, headBlock), alert: a }); sent++;
  }
  return sent;
}
