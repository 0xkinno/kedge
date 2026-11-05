import type { ApiPromise } from '@polkadot/api';
import { u8aToHex } from '@polkadot/util';
import { Interface } from 'ethers';
import { KUSD_ASSET_ID, VAULT_ADDRESS } from './constants';
import type { SweepItem } from './purser';

const vaultIface = new Interface(['function withdrawAllTo(address to)', 'function savingsOf(address) view returns (uint256)']);
export type PlanLine = { label: string; willMove: boolean; reason?: string; amount?: string; item?: SweepItem };

export async function inventory(api: ApiPromise, lost32: Uint8Array, lostH160: string, ethCall: (to: string, data: string) => Promise<string>) {
  const acc = (await api.query.system.account(u8aToHex(lost32))) as any;
  const kusd = (await api.query.assets.account(KUSD_ASSET_ID, u8aToHex(lost32))) as any;
  const sv = await ethCall(VAULT_ADDRESS, vaultIface.encodeFunctionData('savingsOf', [lostH160]));
  return { nativeFree: acc.data.free.toBigInt() as bigint, nativeReserved: acc.data.reserved.toBigInt() as bigint,
    kusd: kusd.isSome ? (kusd.unwrap().balance.toBigInt() as bigint) : 0n, vaultSavings: BigInt(sv) };
}

/** Dry-run each item and show Will move / Will not move before anyone signs. 20% headroom on weight and deposit. */
export async function plan(api: ApiPromise, lost32: Uint8Array, dest32: Uint8Array, destH160: string, inv: Awaited<ReturnType<typeof inventory>>): Promise<PlanLine[]> {
  const lines: PlanLine[] = [];
  if (inv.vaultSavings > 0n) {
    const data = vaultIface.encodeFunctionData('withdrawAllTo', [destH160]);
    const dry: any = (await api.call.reviveApi.call(u8aToHex(lost32), VAULT_ADDRESS, 0, null, null, data)).toJSON();
    const ok = dry?.result?.ok && !(Number(dry.result.ok.flags?.bits ?? dry.result.ok.flags ?? 0) & 1);
    if (!ok) lines.push({ label: 'Allotment vault savings', willMove: false, reason: 'The vault call would fail in a dry run.', amount: inv.vaultSavings.toString() });
    else {
      const w = dry.gasRequired ?? dry.weightRequired; const dep = BigInt(dry.storageDeposit?.charge ?? 0);
      if (dep > inv.nativeFree) lines.push({ label: 'Allotment vault savings', willMove: false, reason: 'The old account lacks tPOT for the contract storage deposit.', amount: inv.vaultSavings.toString() });
      else lines.push({ label: 'Allotment vault savings', willMove: true, amount: inv.vaultSavings.toString(), item: { kind: 'revive', dest: VAULT_ADDRESS, data,
        weightLimit: { refTime: BigInt(w.refTime) * 12n / 10n, proofSize: BigInt(w.proofSize) * 12n / 10n }, depositLimit: dep * 12n / 10n + 10n ** 12n } });
    }
  } else lines.push({ label: 'Allotment vault savings', willMove: false, reason: 'Nothing saved in the vault.' });
  lines.push(inv.kusd > 0n ? { label: 'kUSD (native asset)', willMove: true, amount: inv.kusd.toString(), item: { kind: 'asset', assetId: KUSD_ASSET_ID, amount: inv.kusd } }
    : { label: 'kUSD (native asset)', willMove: false, reason: 'No balance.' });
  lines.push(inv.nativeFree > 0n ? { label: 'tPOT (native)', willMove: true, amount: inv.nativeFree.toString(), item: { kind: 'native', keepAlive: false } }
    : { label: 'tPOT (native)', willMove: false, reason: 'No balance.' });
  return lines;
}
