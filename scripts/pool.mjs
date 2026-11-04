import { connect } from './lib.mjs';
const api = await connect();
const pools = await api.query.assetConversion.pools.entries();
console.log('pools', pools.length);
for (const [k, v] of pools) console.log(JSON.stringify(k.args[0].toHuman()), '=>', JSON.stringify(v.toHuman()));
console.log('assetConversion consts', Object.entries(api.consts.assetConversion).map(([k, v]) => `${k}=${v.toString()}`).join('; '));
await api.disconnect(); process.exit(0);
