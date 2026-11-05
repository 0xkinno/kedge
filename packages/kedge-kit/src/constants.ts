export const NET = {
  substrateWs: 'wss://test-node-v3.portaldot.dev',
  substrateHttp: 'https://test-node-v3.portaldot.dev',
  evmRpc: 'https://test-evm-rpc-v3.portaldot.dev',
  chainId: 420420777,
  chainIdHex: '0x190f1ca9',
  explorer: 'https://scanner-testnet-v3.portaldot.dev',
  specName: 'portaldot-v3',
  specVersion: 3002, // probe asserts this; on mismatch writes are refused
} as const;

export const PALLETS_ADDRESS = '0x6d6f646c70792f70616464720000000000000000' as const;
export const NATIVE_DECIMALS = 14;
export const EVM_DECIMALS = 18;
export const WEI_PER_PLANCK = 10_000n;
/** Kedge native test asset (pUSD 7777 could not be used: its tPOT pool holds about 127 pUSD). */
export const KUSD_ASSET_ID = 20261104;
export const KUSD_DECIMALS = 6;
export const assetPrecompile = (id: number) =>
  (`0x${id.toString(16).padStart(8, '0')}${'0'.repeat(24)}00010000`) as `0x${string}`;
export const VAULT_ADDRESS = '0x92cD058Cb7E4d69476bFc7Cbb7630C50f13B57D4' as const;
/** Recovery pallet index on V3 (verified in live metadata, PLATFORM_PROBE part 3). */
export const RECOVERY_PALLET_INDEX = 30;
export const explorerBlock = (n: number) => `${NET.explorer}/#/blocks/${n}?tab=events`;
