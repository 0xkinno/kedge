// Stores. Upstash REST when UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set, otherwise a local file (dev and tests).
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
export function upstash(url, token) {
  const cmd = async (...args) => { const r = await fetch(url, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify(args) }); const j = await r.json(); if (j.error) throw new Error(j.error); return j.result; };
  return { kind: 'upstash', get: (k) => cmd('GET', k), set: (k, v) => cmd('SET', k, v), setNx: async (k, v) => (await cmd('SET', k, v, 'NX')) === 'OK',
    list: async (prefix) => { const keys = await cmd('KEYS', `${prefix}*`); return Promise.all(keys.map(async (k) => [k, await cmd('GET', k)])); } };
}
export function fileStore(path = process.env.KEDGE_STORE_FILE ?? 'evidence/watch/store.json') {
  const load = () => (existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : {});
  const save = (o) => { mkdirSync(path.split('/').slice(0, -1).join('/') || '.', { recursive: true }); writeFileSync(path, JSON.stringify(o, null, 1)); };
  return { kind: 'file', get: async (k) => load()[k] ?? null, set: async (k, v) => { const o = load(); o[k] = v; save(o); },
    setNx: async (k) => { const o = load(); if (k in o) return false; o[k] = '1'; save(o); return true; },
    list: async (prefix) => Object.entries(load()).filter(([k]) => k.startsWith(prefix)) };
}
export const storeFromEnv = (env = process.env) => (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN ? upstash(env.UPSTASH_REDIS_REST_URL, env.UPSTASH_REDIS_REST_TOKEN) : fileStore());
