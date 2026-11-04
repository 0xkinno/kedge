// Dependency-free SCALE encoder for the calls Kedge uses. Used by the keyless Watchkeeper and by tests, which
// compare it byte for byte with polkadot.js on live V3 metadata. Pallet and call indices verified 2026-11-04.
const hex = (u8) => '0x' + Buffer.from(u8).toString('hex');
const bytes = (h) => Uint8Array.from(Buffer.from(h.replace(/^0x/, ''), 'hex'));
const cat = (...p) => { const n = p.reduce((s, x) => s + x.length, 0); const o = new Uint8Array(n); let i = 0; for (const x of p) { o.set(x, i); i += x.length; } return o; };

export function compact(n) {
  n = BigInt(n);
  if (n < 1n << 6n) return Uint8Array.of(Number(n << 2n));
  if (n < 1n << 14n) { const v = Number(n << 2n) | 1; return Uint8Array.of(v & 255, v >> 8); }
  if (n < 1n << 30n) { const v = Number(n << 2n) | 2; return Uint8Array.of(v & 255, (v >> 8) & 255, (v >> 16) & 255, (v >>> 24) & 255); }
  let b = []; let x = n; while (x > 0n) { b.push(Number(x & 255n)); x >>= 8n; }
  return Uint8Array.of(((b.length - 4) << 2) | 3, ...b);
}
export const u32 = (n) => Uint8Array.of(n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >>> 24) & 255);
export const u128 = (n) => { let x = BigInt(n); const o = new Uint8Array(16); for (let i = 0; i < 16; i++) { o[i] = Number(x & 255n); x >>= 8n; } return o; };
export const vec = (items) => cat(compact(items.length), ...items);
export const idAddr = (acct32) => cat(Uint8Array.of(0), bytes(acct32)); // MultiAddress::Id
export const bool = (b) => Uint8Array.of(b ? 1 : 0);

const P = { system: 0, balances: 6, utility: 1, assets: 39, revive: 80, recovery: 30 };
const call = (p, c, ...args) => cat(Uint8Array.of(P[p], c), ...args);

export const remarkWithEvent = (h) => hex(call('system', 7, cat(compact(bytes(h).length), bytes(h))));
export const transferKeepAlive = (dest, value) => hex(call('balances', 3, idAddr(dest), compact(value)));
export const transferAll = (dest, keepAlive) => hex(call('balances', 4, idAddr(dest), bool(keepAlive)));
export const assetsTransfer = (id, dest, amount) => hex(call('assets', 8, compact(id), idAddr(dest), compact(amount)));
export const forceBatch = (callHexes) => hex(call('utility', 4, vec(callHexes.map(bytes))));
export const controlInheritedAccount = (recovered, innerHex) => hex(call('recovery', 0, idAddr(recovered), bytes(innerHex)));
export const revokeInheritor = () => hex(call('recovery', 1));
export const friendGroup = (g) => cat(vec(g.friends.map(bytes)), u32(g.friendsNeeded), bytes(g.inheritor), u32(g.inheritanceDelay), u32(g.inheritancePriority), u32(g.cancelDelay));
export const setFriendGroups = (groups) => hex(call('recovery', 2, vec(groups.map(friendGroup))));
export const initiateAttempt = (lost, gi) => hex(call('recovery', 3, idAddr(lost), u32(gi)));
export const approveAttempt = (lost, gi) => hex(call('recovery', 4, idAddr(lost), u32(gi)));
export const finishAttempt = (lost, gi) => hex(call('recovery', 5, idAddr(lost), u32(gi)));
export const cancelAttempt = (lost, gi) => hex(call('recovery', 6, idAddr(lost), u32(gi)));
export const slashAttempt = (gi) => hex(call('recovery', 7, u32(gi)));
export const RECOVERY_EVENTS = ['AttemptApproved', 'AttemptCanceled', 'AttemptInitiated', 'AttemptFinished', 'AttemptDiscarded', 'AttemptSlashed', 'FriendGroupsChanged', 'InheritorRevoked', 'RecoveredAccountControlled'];
