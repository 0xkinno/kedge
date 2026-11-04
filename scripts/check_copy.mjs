#!/usr/bin/env node
// House-style and competitor-name guard. Fails on: emoji, em or en dashes, hype words,
// and any sample-project name (stored here only as SHA-256 hashes) outside reference/.
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const SAMPLE_HASHES = new Set([
  'b58ccbc3560d69ba13614a5c5fbdd8f6ecd509b19b0f2e5f12f26d670849b93d',
  'd5e94c248b5e3d566f71a2fec76a032ecfa3acf07cfd5d26cc9c9071a2c43fd5',
  '105c73559662b8d43ca829ee74c3bfc39c8b46cbccda6cf98fde7b1eae5b27cc',
  'e478353d5c1e32b7a820e5196724eafcfa40e662b93a6cccdf90fb148c10afbd',
  'c729c5258e5db98db75a6a5cae845c2b07303071fe6c38ba55e71b6ff237a0fe',
  'e8522fd87f748c388684c3eff07de12ac2f77d5c8f5f0222d50c7e819e26ca91',
  'df61e2ffca5905b5d30989921a2929330799280ddd721e1d32122550000bad39',
  '1e416ef9375ce75fd7ff8daf0be0e054045f23eeb826125bc99f8f09c1094c5f',
  'a765f5aa28cdd9e81934b8ca401d4b00ba1a13abbb163bc9c6ac04a6f8751d1a',
  '87e9c97e54b9acb5a0e610f9386afc3d1bf48301cc185462446ecca0bb181c59',
  'd4200e424d8dce8c9a0edcec888cbc735ef5ed658768b528c2c44a826103cd48',
  '8b1412b48c25726a528884b4a1c0b44b29b93668a42bd12a8636d028e5633cdf',
  'eb424190e72f956401ac6f0567d292d493e93be0b35d7676b39af7c0be6fbfe9',
  'ebc8c2b3237557df9904904f6a8f9023e4992d5064af983ea7bbd2c8b1fac881',
  'a8c73b9194e6dffc5595f6dba0140d9346ae17b00db598efb1cb25f353c9f77e',
  '16812233852fe1f683b090655ace2065c5ed0c660074a9ecfdf0ba00bc33bc5f',
  '101559d07e48389707db71dfd4000b26ab4c0f64c2785ef1530f48008b51371b',
  'e6523f80397d076857dae0108a7c360a93648442f215a450be5cc9175ca827cc',
  'd34f93680dc8e1a529f259ed235c823ed8ee6c13a0820cfa41cf60b56feefff8',
  '72d824684645aaf3851592892ad89a62af7b38f9e55ab40de54190f5446ce208',
  'ece12ac63a48cc43317d17ad4fda11da5a0d65acf20f008b33a73980d518ad32',
  'c2503df3023b9627c1e5f5ed8d60646a3b85b45f388012d1907aea4d17ca2312',
  'd183be7d78a89938e7a97d1e63e7a5b7340467dc78ee759a2e5a9ca4cb55bb3f',
  'c9808d2bab69cd38bdd6cd79a3f5f15eb52d6ed178fb71f9d4e8b7935e8decea',
  '4f8b6f6d9f22a70be7269811804ceeaac153d7d4a95dcd4f4aacbef876a7a957',
  '168ee09f96df4c38849d14d6b72b238995289c6014d8602d1c0b71f0db58c429',
  '648eb6dc0e0baf7f73ba55d8f7d74fac22d5a9c6ad885dd865a8a62029bc0766',
  'e15707ec80a444069a34dc3b69d70ccf4d449b266f9eca392986951861a4059d',
  '664d316292a37b1e79ca84f5d1d8656138ab049869b571227c3c338316ca4d7b',
  '75fc0744bf6392f62f5e2e23d678c3d720d34dc01381e49b11e2a317bb711ee4',
  '5ed64cb598fba66d51b0cc3cc9057a6d41f874a1d6a0e2de7c885cd3cbac16ac',
  '5adf867b578796cc03a812d3ecde628622b4bb128136c806496300e513d3e986',
  'cf5610a3f378dc2a69121d6ecbd8aa92a4ab5c5dd9d54d71917430f97f811fbb',
  '5f9eb40df735cca22789a2a7776f85da3a7b781dee9656b39bfdcde60304effd',
  '0b8f2492dc042c64963cde00f991cbdb5376f62c87882ffbcb115a5e3be57944',
  '126e0b896a907ef12f3da93bb0547d4b6850cf1c448c46868748239f6ae09b88',
  '9e6e8db8e7404df067453170e3ea06bbc9d5f8cddc00f76cc618ef7b611a26c3',
  'ba1c566a4bad288c22a0b7511458c92ca5822cd41632e51806e9ea75ed12d13d'
]);
// Hype words are written with a character class so this file does not trip its own check.
const HYPE = [/revolution[a]ry/i, /seam[l]ess/i, /cutting[- ]edge/i, /game[- ]chang/i, /ground[b]reaking/i,
  /next[- ]gen/i, /world[- ]class/i, /unle[a]sh/i, /super[c]harge/i, /bl[a]zing/i, /best[- ]in[- ]class/i,
  /state[- ]of[- ]the[- ]art/i, /par[a]digm/i, /\bdel[v]e\b/i, /\bemp[o]wer/i, /\brob[u]st\b/i];
const EMOJI = new RegExp('\\p{Extended_Pictographic}|' + String.fromCharCode(0xfe0f) + '|' + String.fromCharCode(0x200d), 'u');
const DASH = new RegExp('[' + String.fromCharCode(0x2013) + String.fromCharCode(0x2014) + ']');
const SELF = 'scripts/check_copy.mjs';
const SKIP = /(^|\/)(node_modules|reference|contracts\/lib|contracts\/out|contracts\/cache|\.next|out|cache|keys|evidence\/raw\/private)\//;
const SKIP_FILES = /(words\.json|package-lock\.json|\.(png|jpe?g|webp|gif|pdf|woff2?|ico|mp3|mp4)$)/i;

const tracked = execSync('git ls-files --cached --others --exclude-standard', { encoding: 'utf8' })
  .split('\n').filter(Boolean).filter((f) => existsSync(f));
const hash = (s) => createHash('sha256').update(s).digest('hex');
let bad = 0;
const fail = (f, n, why) => { console.error(`FAIL ${f}:${n} ${why}`); bad++; };

for (const f of tracked) {
  if (SKIP.test(f) || SKIP_FILES.test(f)) continue;
  const lines = readFileSync(f, 'utf8').split('\n');
  lines.forEach((line, i) => {
    const n = i + 1;
    if (EMOJI.test(line)) fail(f, n, 'emoji');
    if (f !== SELF && DASH.test(line)) fail(f, n, 'em or en dash');
    if (f !== SELF) for (const h of HYPE) if (h.test(line)) fail(f, n, `hype word ${h}`);
    for (const tok of line.toLowerCase().match(/[a-z0-9][a-z0-9-]*/g) ?? []) {
      const parts = new Set([tok, ...tok.split('-')]);
      for (const p of parts) if (SAMPLE_HASHES.has(hash(p))) fail(f, n, 'sample-project name (hash match)');
    }
  });
}
if (bad) { console.error(`check_copy: ${bad} problem(s)`); process.exit(1); }
console.log(`check_copy: ok (${tracked.length} files scanned)`);
