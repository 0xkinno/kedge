// Server-only helpers: shared connections, EVM rpc, store. Reads only. The server holds no user key; drill keys come from env and sign drills only.
import { JsonRpcProvider } from 'ethers';
import { api as polkadot, withApi } from '@/lib/kedge/purser';
import { NET } from '@/lib/kedge/constants';
import { fileStore, upstash } from '../../../watch/store.mjs';

export const evmProvider = new JsonRpcProvider(NET.evmRpc, { chainId: NET.chainId, name: 'portaldot-v3' }, { staticNetwork: true });
export const evmRpc = (m: string, p: unknown[]) => evmProvider.send(m, p);
export const chainApi = polkadot;
export { withApi };
export const store = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
  ? upstash(process.env.UPSTASH_REDIS_REST_URL, process.env.UPSTASH_REDIS_REST_TOKEN) : fileStore(process.env.KEDGE_STORE_FILE ?? '/tmp/kedge-store.json');
export const storeKind = store.kind as string;
export const hexToU8 = (h: string) => Uint8Array.from(Buffer.from(h.replace(/^0x/, ''), 'hex'));
export const json = (o: unknown, status = 200) => new Response(JSON.stringify(o, (_, v) => (typeof v === 'bigint' ? v.toString() : v)), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
