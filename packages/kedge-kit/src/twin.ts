import { keccak256, getBytes, hexlify } from 'ethers';
import { encodeAddress, decodeAddress } from '@polkadot/util-crypto';

/** EVM address -> native twin AccountId32: h160 followed by twelve 0xEE bytes (verified by ReviveApi_account_id). */
export function twinOf(h160: string): Uint8Array {
  const a = getBytes(h160);
  if (a.length !== 20) throw new Error('not a 20-byte address');
  const out = new Uint8Array(32); out.set(a, 0); out.fill(0xee, 20);
  return out;
}
/** Native AccountId32 -> EVM address. Eth-derived accounts strip the EE tail; others use the last 20 bytes of keccak256 (verified). */
export function h160Of(account32: Uint8Array): string {
  if (account32.length !== 32) throw new Error('not a 32-byte account');
  if (account32.slice(20).every((b) => b === 0xee)) return hexlify(account32.slice(0, 20));
  return hexlify(getBytes(keccak256(account32)).slice(12));
}
export const isEthTwin = (a: Uint8Array) => a.length === 32 && a.slice(20).every((b) => b === 0xee);
export const ss58 = (a: Uint8Array) => encodeAddress(a, 42);
export const fromSs58 = (s: string) => decodeAddress(s);
export const toHex32 = (a: Uint8Array) => hexlify(a);
