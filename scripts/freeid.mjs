import { connect } from './lib.mjs';
const api = await connect();
for (const id of [20261104, 20261105, 4217]) console.log(id, (await api.query.assets.asset(id)).isSome ? 'TAKEN' : 'free');
await api.disconnect(); process.exit(0);
