import { connect } from './lib.mjs';
const api = await connect();
const c = api.tx.revive.call; console.log('revive.call', c.meta.args.map((a) => `${a.name}:${a.type}`).join(', '));
console.log('revive txs', Object.keys(api.tx.revive).join(','));
console.log('reviveApi', Object.keys(api.call.reviveApi ?? {}).join(','));
const m = api.call.reviveApi?.call?.meta; if (m) console.log('reviveApi.call params', m.params.map((p) => `${p.name}:${p.type}`).join(', '));
await api.disconnect(); process.exit(0);
