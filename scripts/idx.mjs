import { connect } from './lib.mjs';
const api = await connect();
for (const [p, m] of [['system','remarkWithEvent'],['balances','transferKeepAlive'],['balances','transferAll'],['utility','forceBatch'],['assets','transfer'],['revive','call']]) console.log(p, m, api.tx[p][m].callIndex.toString());
console.log('assets.transferAll?', !!api.tx.assets.transferAll);
const ev = api.events.recovery; for (const k of Object.keys(ev)) console.log('event', k, ev[k].meta.index?.toString?.() ?? '', Buffer.from(ev[k].meta.index.toU8a?.() ?? []).toString('hex'));
console.log('recovery pallet idx', api.events.recovery.AttemptInitiated.index.toHex(), api.events.recovery.AttemptInitiated.meta.fields.map((f) => f.name.toString()).join(','));
await api.disconnect(); process.exit(0);
