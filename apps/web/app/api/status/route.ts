// Measured status only: every field is what a real probe returned just now, with a timestamp. Nothing is hard-coded to "up".
import { NET, VAULT_ADDRESS } from '@/lib/kedge/constants';
import { json, storeKind } from '@/lib/server';
export const dynamic = 'force-dynamic';
const rpc = async (url: string, method: string, params: unknown[] = []) => {
  const t0 = Date.now(); const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }), signal: AbortSignal.timeout(8000) });
  const j = await r.json(); return { result: j.result, ms: Date.now() - t0 };
};
const probe = async (name: string, fn: () => Promise<any>) => { const at = new Date().toISOString(); try { return { name, ok: true, at, ...(await fn()) }; } catch (e: any) { return { name, ok: false, at, error: String(e?.message ?? e).slice(0, 160) }; } };
export async function GET() {
  const checks = await Promise.all([
    probe('substrate head', async () => { const h = await rpc(NET.substrateHttp, 'chain_getHeader'); return { block: parseInt(h.result.number, 16), ms: h.ms }; }),
    probe('runtime version', async () => { const v = await rpc(NET.substrateHttp, 'state_getRuntimeVersion'); const ok = v.result.specName === NET.specName && v.result.specVersion === NET.specVersion; return { specName: v.result.specName, specVersion: v.result.specVersion, matchesPinned: ok, ms: v.ms }; }),
    probe('evm chain id', async () => { const c = await rpc(NET.evmRpc, 'eth_chainId'); return { chainId: parseInt(c.result, 16), ms: c.ms }; }),
    probe('vault code', async () => { const c = await rpc(NET.evmRpc, 'eth_getCode', [VAULT_ADDRESS, 'latest']); return { present: c.result && c.result !== '0x', bytes: (c.result.length - 2) / 2, ms: c.ms }; }),
  ]);
  const writesAllowed = checks.every((c) => c.ok) && (checks[1] as any).matchesPinned === true;
  return json({ at: new Date().toISOString(), writesAllowed, reason: writesAllowed ? null : 'a probe failed or the runtime spec changed; writes are refused until it recovers', checks,
    labelled: { sharedStore: storeKind, drillKillSwitch: process.env.DRILL_KILL === '1' ? 'on' : 'off', hero: 'AI-generated photograph' } });
}
