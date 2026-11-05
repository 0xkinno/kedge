import { defineConfig } from 'tsup';
export default defineConfig({
  entry: ['src/index.ts'], format: ['esm', 'cjs'], dts: true, clean: true, sourcemap: false, target: 'es2022',
  external: ['ethers', '@polkadot/api', '@polkadot/util', '@polkadot/util-crypto', '@polkadot/keyring'],
  loader: { '.mjs': 'js' },
});
