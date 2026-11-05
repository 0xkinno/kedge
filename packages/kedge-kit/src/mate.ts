import { isEthTwin } from './twin';
import { hexlify } from 'ethers';
import type { GroupSpec } from './purser';

export class KedgeRefusal extends Error { constructor(public code: string, msg: string) { super(msg); } }
const eq = (a: Uint8Array, b: Uint8Array) => Buffer.compare(Buffer.from(a), Buffer.from(b)) === 0;
/** KEDGE_SABOTAGE=sort|inheritor|delay|phrase skips that check in a test build to prove the chain or UI still refuses. */
const sabotage = () => (typeof process !== 'undefined' ? process.env.KEDGE_SABOTAGE : undefined);

/** A Solidity contract cannot sign control_inherited_account (probe part 8: a contract calling the pallets address is a no-op). */
export async function refuseContractInheritor(inheritor32: Uint8Array, getCode: (h160: string) => Promise<string>) {
  if (sabotage() === 'inheritor') return;
  if (!isEthTwin(inheritor32)) return;
  const code = await getCode(hexlify(inheritor32.slice(0, 20)));
  if (code && code !== '0x') throw new KedgeRefusal('INHERITOR_IS_CONTRACT', 'This inheritor is a contract. A contract cannot claim a recovered account on Portaldot, so the money would be stuck.');
}

export function checkGroups(lost32: Uint8Array, groups: GroupSpec[]) {
  if (groups.length === 0) throw new KedgeRefusal('NO_GROUPS', 'Add at least one group.');
  groups.forEach((g, i) => {
    if (g.friends.length === 0) throw new KedgeRefusal('NO_FRIENDS', `Group ${i} has no guardians.`);
    if (g.friends.some((f) => eq(f, lost32))) throw new KedgeRefusal('LOST_IN_GROUP', 'Your own account cannot be your guardian.');
    if (sabotage() !== 'sort') {
      const sorted = [...g.friends].sort((a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b)));
      if (g.friends.some((f, j) => !eq(f, sorted[j])) ) { /* callers may pass unsorted; purser sorts. duplicates are the refusal */ }
      for (let j = 1; j < sorted.length; j++) if (eq(sorted[j - 1], sorted[j])) throw new KedgeRefusal('DUPLICATE_GUARDIAN', 'The same guardian is listed twice.');
    }
    if (g.friendsNeeded < 1 || g.friendsNeeded > g.friends.length) throw new KedgeRefusal('BAD_THRESHOLD', 'Approvals needed must be between 1 and the number of guardians.');
    if (g.cancelDelay < 1) throw new KedgeRefusal('NO_CANCEL_DELAY', 'The cancel delay must be at least 1 block.');
  });
  const key = (g: GroupSpec) => [...g.friends].map((f) => hexlify(f)).sort().join();
  const seen = new Set<string>();
  for (const g of groups) { const k = key(g); if (seen.has(k)) throw new KedgeRefusal('DUPLICATE_GROUPS', 'Two groups have identical guardians.'); seen.add(k); }
}

export function checkFinishable(clock: { finishable: boolean; blocksLeft: number }) {
  if (sabotage() === 'delay') return;
  if (!clock.finishable) throw new KedgeRefusal('DELAY_NOT_PASSED', `The safety delay has ${clock.blocksLeft} block(s) left.`);
}
export function checkGuardianCanPay(freePlanck: bigint, feePlanck: bigint, securityDeposit: bigint) {
  if (freePlanck < feePlanck + securityDeposit) throw new KedgeRefusal('CANNOT_PAY', 'This account cannot cover the fee and deposit.');
}
