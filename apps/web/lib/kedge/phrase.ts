import { keccak256, concat, toUtf8Bytes, getBytes } from 'ethers';
import WORDS from './words.json';

/** Four words binding (lost, inheritor, group, chain). Advisory UI: the chain enforces threshold and delay. */
export function callPhrase(lost32: Uint8Array, inheritor32: Uint8Array, group: number, chainId = 420420777): string[] {
  const h = getBytes(keccak256(concat([toUtf8Bytes('kedge/call-phrase/v1'), lost32, inheritor32, Uint8Array.of(group), toUtf8Bytes(String(chainId))])));
  const out: string[] = [];
  for (let i = 0; i < 4; i++) out.push((WORDS as string[])[((h[i * 2] << 8) | h[i * 2 + 1]) % 2048]);
  return out;
}
/** Case-insensitive, extra spaces ignored. */
export const phraseMatches = (typed: string, expected: string[]) =>
  typed.trim().toLowerCase().split(/\s+/).join(' ') === expected.join(' ');
