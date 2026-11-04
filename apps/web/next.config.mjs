/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,
  serverExternalPackages: ['@polkadot/api', '@polkadot/util', '@polkadot/util-crypto', '@polkadot/keyring'],
  experimental: { externalDir: true },
  headers: async () => [{ source: '/(.*)', headers: [{ key: 'X-Content-Type-Options', value: 'nosniff' }, { key: 'Referrer-Policy', value: 'no-referrer' }] }],
};
