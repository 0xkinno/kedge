import { connect } from './lib.mjs';
const api = await connect();
for (const [pal, calls] of Object.entries(api.tx)) for (const m of Object.keys(calls)) if (/swap|liquidity|addLiq/i.test(m)) console.log('tx', pal + '.' + m);
console.log('pallets with Asset in name:', Object.keys(api.tx).filter((p) => /asset|pool|conv|dex|swap/i.test(p)).join(','));
console.log('poolAssets calls:', Object.keys(api.tx.poolAssets ?? {}).join(','));
const c = await api.query.assets.account.keys?.(7777); 
let n = 0; for (const [k, v] of await api.query.assets.account.entries(7777)) { if (n++ < 6) console.log('holder', k.args[1].toString(), v.unwrap().balance.toString()); }
console.log('pUSD holders', n);
await api.disconnect(); process.exit(0);
