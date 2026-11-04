import { connect } from './lib.mjs';
const api = await connect(); const n = Number(process.argv[2]);
const ev = await api.query.system.events.at(await api.rpc.chain.getBlockHash(n));
for (const e of ev) if (/Held|Released|Slash|Burned|TransferAndHold/.test(e.event.method)) console.log(n, e.event.section + '.' + e.event.method, JSON.stringify(e.event.data.toHuman()));
await api.disconnect(); process.exit(0);
