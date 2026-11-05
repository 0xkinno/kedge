// Kedge Kit: everything a Portaldot dApp needs to add recovery. One implementation, used by the Kedge app itself.
export * from './constants';
export * from './twin';
export * from './phrase';
export * from './mate';
export * from './purser';
export * from './helm';
export * from './lookout';
export * from './survey';
/** Dependency-free SCALE encoder for the same calls (no polkadot.js needed; byte-equal on live metadata). */
export * as scale from './scale.mjs';
