#!/usr/bin/env node
// Compile contracts/src/*.sol with solc-js using the settings V3 accepts. Output: contracts/out/<Name>.json
import solc from 'solc';
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
const sources = {};
for (const f of readdirSync('contracts/src').filter((x) => x.endsWith('.sol'))) sources[f] = { content: readFileSync(`contracts/src/${f}`, 'utf8') };
const input = { language: 'Solidity', sources, settings: { evmVersion: 'paris', optimizer: { enabled: true, runs: 200 },
  metadata: { bytecodeHash: 'none', appendCBOR: false }, outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object', 'evm.deployedBytecode.object'] } } } };
const out = JSON.parse(solc.compile(JSON.stringify(input)));
for (const e of out.errors ?? []) console.error(e.formattedMessage);
if ((out.errors ?? []).some((e) => e.severity === 'error')) process.exit(1);
mkdirSync('contracts/out', { recursive: true });
for (const [file, cs] of Object.entries(out.contracts)) for (const [name, c] of Object.entries(cs)) {
  writeFileSync(`contracts/out/${name}.json`, JSON.stringify({ name, abi: c.abi, bytecode: '0x' + c.evm.bytecode.object, deployedBytecode: '0x' + c.evm.deployedBytecode.object, solc: '0.8.28', evmVersion: 'paris' }, null, 2));
  console.log(name, 'creation bytes', c.evm.bytecode.object.length / 2, 'runtime bytes', c.evm.deployedBytecode.object.length / 2);
}
