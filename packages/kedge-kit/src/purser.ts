import { ApiPromise, WsProvider } from '@polkadot/api';
import { u8aToHex } from '@polkadot/util';
import { NET } from './constants';

let apiP: Promise<ApiPromise> | null = null;
/** One shared connection. A serverless instance can be frozen while its websocket closes, so every use checks the link
 *  and builds a new connection when the old one is gone. */
export async function api(): Promise<ApiPromise> {
  if (apiP) {
    try { const a = await apiP; if (a.isConnected) return a; await a.disconnect().catch(() => {}); } catch { /* fall through and reconnect */ }
    apiP = null;
  }
  apiP = ApiPromise.create({ provider: new WsProvider(NET.substrateWs), noInitWarn: true });
  apiP.catch(() => { apiP = null; });
  return apiP;
}
/** Run a chain read; if the connection died mid-flight, reconnect and retry once. */
export async function withApi<T>(fn: (a: ApiPromise) => Promise<T>): Promise<T> {
  try { return await fn(await api()); }
  catch (e) { await closeApi().catch(() => {}); return await fn(await api()); }
}
export async function closeApi() { if (apiP) { const a = await apiP; await a.disconnect(); apiP = null; } }

export type GroupSpec = {
  friends: Uint8Array[]; friendsNeeded: number; inheritor32: Uint8Array;
  inheritanceDelay: number; priority: number; cancelDelay: number;
};
export type SweepItem =
  | { kind: 'native'; keepAlive: boolean }
  | { kind: 'asset'; assetId: number; amount: bigint }
  | { kind: 'revive'; dest: string; weightLimit: { refTime: bigint; proofSize: bigint }; depositLimit: bigint; data: string };

/** Friends MUST be sorted bytewise and unique (pallet rule FriendsNotSortedOrUnique). */
export function sortFriends(list: Uint8Array[]): Uint8Array[] {
  const s = [...list].sort((a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b)));
  for (let i = 1; i < s.length; i++) if (Buffer.compare(Buffer.from(s[i - 1]), Buffer.from(s[i])) === 0) throw new Error('duplicate guardian');
  return s;
}

/** Arg shapes are read from live metadata at call time, so a runtime rename shows up as an error here, not a silent bad call. */
function groupArg(g: GroupSpec) {
  return {
    friends: sortFriends(g.friends).map((x) => u8aToHex(x)),
    friendsNeeded: g.friendsNeeded, inheritor: u8aToHex(g.inheritor32),
    inheritanceDelay: g.inheritanceDelay, inheritancePriority: g.priority, cancelDelay: g.cancelDelay,
  };
}
export async function setFriendGroups(groups: GroupSpec[]) {
  const a = await api();
  const names = a.tx.recovery.setFriendGroups.meta.args.map((x) => x.name.toString());
  if (names.join() !== 'friendGroups') throw new Error(`recovery.setFriendGroups args changed on chain: ${names}`);
  return a.tx.recovery.setFriendGroups(groups.map(groupArg)).method.toHex();
}
const id = (x: Uint8Array) => ({ Id: u8aToHex(x) });
export const initiate = async (lost: Uint8Array, gi: number) => (await api()).tx.recovery.initiateAttempt(id(lost), gi).method.toHex();
export const approve = async (lost: Uint8Array, gi: number) => (await api()).tx.recovery.approveAttempt(id(lost), gi).method.toHex();
export const finish = async (lost: Uint8Array, gi: number) => (await api()).tx.recovery.finishAttempt(id(lost), gi).method.toHex();
export const cancel = async (lost: Uint8Array, gi: number) => (await api()).tx.recovery.cancelAttempt(id(lost), gi).method.toHex();
export const slash = async (gi: number) => (await api()).tx.recovery.slashAttempt(gi).method.toHex();
export const revokeInheritor = async () => (await api()).tx.recovery.revokeInheritor().method.toHex();

/** The rescue: one call, run as the lost account by the inheritor. force_batch continues past a failed item.
 *  Order matters: contract items first (they may need tPOT for storage deposits), assets next, native last. */
export async function bringHome(lost32: Uint8Array, dest32: Uint8Array, items: SweepItem[]) {
  const a = await api();
  const rank = { revive: 0, asset: 1, native: 2 } as const;
  const inner = [...items].sort((x, y) => rank[x.kind] - rank[y.kind]).map((it) => {
    switch (it.kind) {
      case 'native': return a.tx.balances.transferAll(id(dest32), it.keepAlive);
      case 'asset': return a.tx.assets.transfer(it.assetId, id(dest32), it.amount);
      case 'revive': return a.tx.revive.call(it.dest, 0, it.weightLimit, it.depositLimit, it.data);
    }
  });
  return a.tx.recovery.controlInheritedAccount(id(lost32), a.tx.utility.forceBatch(inner)).method.toHex();
}
export const remark = async (text: string) => (await api()).tx.system.remarkWithEvent(text).method.toHex();
