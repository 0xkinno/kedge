import { connect } from './lib.mjs';
const api = await connect();
for (const k of Object.keys(api.events.recovery)) console.log(k, api.events.recovery[k].meta.fields.map((f) => `${f.name}:${f.typeName}`).join(', '));
await api.disconnect(); process.exit(0);
