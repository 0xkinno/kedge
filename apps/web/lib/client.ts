'use client';
// Browser helpers. The person's own wallet signs everything; nothing here holds a key.
import { sendRuntimeCall } from '@/lib/kedge/helm';
import { NET } from '@/lib/kedge/constants';
import { twinOf } from '@/lib/kedge/twin';
import * as S from '../../../watch/scale.mjs';

export const rpc = async (method: string, params: unknown[]) => {
  const r = await fetch(NET.evmRpc, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) });
  const j = await r.json(); if (j.error) throw new Error(j.error.message); return j.result;
};
export const eth = () => (typeof window !== 'undefined' ? (window as any).ethereum : undefined);
export async function connect(): Promise<string> {
  const e = eth(); if (!e) throw new Error('No wallet found. Install MetaMask or open this page in the MetaMask browser.');
  const [acct] = await e.request({ method: 'eth_requestAccounts' });
  try { await e.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: NET.chainIdHex }] }); }
  catch { await e.request({ method: 'wallet_addEthereumChain', params: [{ chainId: NET.chainIdHex, chainName: 'Portaldot V3 testnet', nativeCurrency: { name: 'tPOT', symbol: 'tPOT', decimals: 18 }, rpcUrls: [NET.evmRpc], blockExplorerUrls: [NET.explorer] }] }); }
  return acct;
}
export const persist = (hash: string, callHex: string) => { try { const k = 'kedge:pending'; const l = JSON.parse(localStorage.getItem(k) ?? '[]'); l.push({ hash, callHex, at: Date.now() }); localStorage.setItem(k, JSON.stringify(l.slice(-30))); } catch { /* storage may be blocked */ } };
export async function sendCall(from: string, callHex: string) { return sendRuntimeCall(eth(), rpc, from, callHex, persist); }
export const trace = async (hash: string) => { const r = await fetch(`/api/trace?hash=${hash}`); const j = await r.json(); if (!r.ok) throw new Error(j.error); return j; };
const hex32 = (h160: string) => '0x' + Buffer.from(twinOf(h160)).toString('hex');
export const calls = {
  setGroups: (groups: { friends: string[]; need: number; heir: string; delay: number; priority: number; cancel: number }[]) =>
    S.setFriendGroups(groups.map((g) => ({ friends: g.friends.map(hex32).sort(), friendsNeeded: g.need, inheritor: hex32(g.heir), inheritanceDelay: g.delay, inheritancePriority: g.priority, cancelDelay: g.cancel }))),
  initiate: (lost: string, gi: number) => S.initiateAttempt(hex32(lost), gi), approve: (lost: string, gi: number) => S.approveAttempt(hex32(lost), gi),
  finish: (lost: string, gi: number) => S.finishAttempt(hex32(lost), gi), cancel: (lost: string, gi: number) => S.cancelAttempt(hex32(lost), gi), slash: (gi: number) => S.slashAttempt(gi),
};
export const short = (a: string) => `${a.slice(0, 6)}...${a.slice(-4)}`;
