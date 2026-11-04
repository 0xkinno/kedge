import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingRoot: path.join(here, '../..'),
  serverExternalPackages: ['@polkadot/api', '@polkadot/util', '@polkadot/util-crypto', '@polkadot/keyring'],
  experimental: { externalDir: true },
  // An explicit alias: the tsconfig include glob treats the [lost] route folders as character classes.
  webpack: (config) => { config.resolve.alias['@'] = here; return config; },
  headers: async () => [{ source: '/(.*)', headers: [{ key: 'X-Content-Type-Options', value: 'nosniff' }, { key: 'Referrer-Policy', value: 'no-referrer' }] }],
};
