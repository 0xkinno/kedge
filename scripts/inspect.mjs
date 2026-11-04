import { connect, loadKey } from './lib.mjs';
const api = await connect(); const name = process.argv[2]; const k = loadKey(name); const a = k.twinSs58 ?? k.ss58;
const acc = await api.query.system.account(a);
console.log(name, JSON.stringify(acc.toHuman()));
for (const pal of ['balances']) for (const q of ['holds','freezes','locks','reserves']) { try { console.log(q, JSON.stringify((await api.query[pal][q](a)).toHuman())); } catch (e) {} }
// any recovery-related consideration storage via ticket in friendGroups tuple
console.log('friendGroups raw', JSON.stringify((await api.query.recovery.friendGroups(api.createType('AccountId32', a).toHex())).toHuman()).slice(0, 80));
await api.disconnect(); process.exit(0);
