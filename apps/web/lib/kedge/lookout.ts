import type { ApiPromise } from '@polkadot/api';
import { u8aToHex } from '@polkadot/util';

export type Attempt = { groupIndex: number; initiator: string; initBlock: number; lastApprovalBlock: number; approvedIndexes: number[] };

/** The approvals bitfield is an array of 16-bit words (7 words for MaxFriendsPerConfig = 100). Bit i of the
 *  sorted friend list is word floor(i/16), bit i%16. Verified against recorded probe data in the tests. */
export function approvedIndexes(words: (string | number)[], wordBits = 16): number[] {
  const out: number[] = [];
  words.forEach((w, wi) => { const v = Number(String(w).replace(/,/g, '')); for (let b = 0; b < wordBits; b++) if (v & (1 << b)) out.push(wi * wordBits + b); });
  return out;
}

export async function friendGroups(api: ApiPromise, lost32: Uint8Array) {
  const v = (await api.query.recovery.friendGroups(u8aToHex(lost32))).toJSON() as any;
  return v ? (v[0] as any[]) : [];
}
export async function attempts(api: ApiPromise, lost32: Uint8Array): Promise<Attempt[]> {
  const raw = (await api.query.recovery.attempt.entries(u8aToHex(lost32))) as any[];
  return raw.map(([k, v]) => { const j = v.toJSON() as any; const a = j[0];
    return { groupIndex: Number(k.args[1].toString()), initiator: a.initiator, initBlock: a.initBlock, lastApprovalBlock: a.lastApprovalBlock,
      approvedIndexes: approvedIndexes((v.toHuman() as any)[0].approvals) }; });
}
export async function inheritor(api: ApiPromise, lost32: Uint8Array) {
  const v = (await api.query.recovery.inheritor(u8aToHex(lost32))).toJSON() as any; return v ? { priority: v[0], account: v[1] as string } : null;
}
/** Delay clock: finishable when head >= initBlock + inheritanceDelay (verified: finish accepted after init+10). */
export function delayClock(initBlock: number, inheritanceDelay: number, head: number, blockSeconds = 6) {
  const ready = initBlock + inheritanceDelay; const left = Math.max(0, ready - head);
  return { readyAtBlock: ready, blocksLeft: left, secondsLeft: left * blockSeconds, finishable: head >= ready };
}
