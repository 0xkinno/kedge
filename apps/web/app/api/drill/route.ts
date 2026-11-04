// Muster Drill: a complete rescue on testnet, streamed step by step. HOUSE CREW KEYS sign this, never a user.
// Public lock (one drill at a time), 3 per hour per IP, 20 per day in total, kill switch DRILL_KILL=1.
import { Wallet, formatEther } from 'ethers';
import { twinOf } from '@/lib/kedge/twin';
import * as P from '@/lib/kedge/purser';
import { sendRuntimeCall, resolveOutcome } from '@/lib/kedge/helm';
import { attempts, delayClock } from '@/lib/kedge/lookout';
import { callPhrase } from '@/lib/kedge/phrase';
import { evmProvider, evmRpc, chainApi, store } from '@/lib/server';
export const dynamic = 'force-dynamic'; export const maxDuration = 300;

const KEYS = ['DRILL_RAMON_PK', 'DRILL_LORNA_PK', 'DRILL_BEN_PK', 'DRILL_LIFEBOAT_PK'] as const;
const enc = new TextEncoder();
const refuse = (status: number, error: string) => new Response(JSON.stringify({ error }), { status, headers: { 'content-type': 'application/json' } });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function GET(req: Request) {
  if (process.env.DRILL_KILL === '1') return refuse(503, 'The drill is switched off by the operator (kill switch).');
  if (KEYS.some((k) => !process.env[k])) return refuse(503, 'House crew keys are not configured on this deployment. Drill unavailable; this is labelled, not simulated.');
  const ip = (req.headers.get('x-forwarded-for') ?? 'local').split(',')[0].trim(); const now = Date.now();
  const log: { t: number; ip: string }[] = JSON.parse((await store.get('kedge:drill:log')) ?? '[]').filter((x: any) => now - x.t < 86_400_000);
  if (log.length >= 20) return refuse(429, 'Daily drill cap reached (20). Try again tomorrow, or run the real path on /harbour.');
  if (log.filter((x) => x.ip === ip && now - x.t < 3_600_000).length >= 3) return refuse(429, 'Hourly cap reached (3 per hour).');
  const lock = Number((await store.get('kedge:drill:lock')) ?? 0);
  if (now - lock < 300_000) return refuse(409, 'Another drill is running. Only one at a time. Try again in a minute.');
  await store.set('kedge:drill:lock', String(now)); log.push({ t: now, ip }); await store.set('kedge:drill:log', JSON.stringify(log));

  const crew = { lorna: new Wallet(process.env.DRILL_LORNA_PK!, evmProvider), ben: new Wallet(process.env.DRILL_BEN_PK!, evmProvider), boat: new Wallet(process.env.DRILL_LIFEBOAT_PK!, evmProvider) };
  const stream = new ReadableStream({
    async start(ctl) {
      const emit = (o: object) => ctl.enqueue(enc.encode(`data: ${JSON.stringify(o)}\n\n`));
      const step = (n: number, label: string, status: 'run' | 'ok' | 'fail', detail?: any) => emit({ n, of: 8, label, status, ...detail });
      try {
        const a = await chainApi();
        const ramon = Wallet.createRandom().connect(evmProvider); const lost32 = twinOf(ramon.address);
        const send = async (w: Wallet, hex: string) => {
          const eth = { request: async ({ params }: any) => (await w.sendTransaction({ to: params[0].to, data: params[0].data, gasLimit: params[0].gas, gasPrice: params[0].gasPrice, value: 0n })).hash };
          const hash = await sendRuntimeCall(eth, evmRpc, w.address, hex, () => {}); const out = await resolveOutcome(a, evmRpc, hash, 120_000);
          if (out.extrinsicFailed) throw new Error(`The chain refused: ${out.errorName}`); return out;
        };
        emit({ banner: 'House crew keys sign this drill. For your own wallet, use Harbour.', lost: ramon.address, crew: { lorna: crew.lorna.address, ben: crew.ben.address, newPhone: crew.boat.address } });
        step(0, 'Fund a throwaway wallet from the house pool', 'run');
        const f = await crew.boat.sendTransaction({ to: ramon.address, value: 1_500_000_000_000_000_000n, gasLimit: 6_000_000_000_000n, gasPrice: (await evmProvider.getFeeData()).gasPrice! }); await f.wait();
        step(0, 'Throwaway wallet funded with 1.5 tPOT', 'ok', { tx: f.hash });
        step(1, 'Ramon names his crew (set_friend_groups)', 'run');
        const o1 = await send(ramon, await P.setFriendGroups([{ friends: [twinOf(crew.lorna.address), twinOf(crew.ben.address)], friendsNeeded: 2, inheritor32: twinOf(crew.boat.address), inheritanceDelay: 10, priority: 1, cancelDelay: 2 }]));
        step(1, 'Crew named: 2 of 2, delay 10 blocks', 'ok', { explorer: o1.explorer });
        const phrase = callPhrase(lost32, twinOf(crew.boat.address), 0);
        step(2, 'Lorna hears the call phrase and starts the attempt', 'run', { phrase: phrase.join(' ') });
        const o2 = await send(crew.lorna, await P.initiate(lost32, 0)); step(2, 'Attempt started by Lorna', 'ok', { explorer: o2.explorer, phrase: phrase.join(' ') });
        step(3, 'Ben approves', 'run'); const o3 = await send(crew.ben, await P.approve(lost32, 0)); step(3, 'Ben approved: 2 of 2', 'ok', { explorer: o3.explorer });
        const at = (await attempts(a, lost32))[0];
        for (;;) { const head = (await a.rpc.chain.getHeader()).number.toNumber(); const c = delayClock(at.initBlock, 10, head); step(4, 'Safety delay', 'run', { blocksLeft: c.blocksLeft, secondsLeft: c.secondsLeft }); if (c.finishable) break; await sleep(3000); }
        step(4, 'Safety delay passed', 'ok');
        step(5, 'Finish the attempt (new phone becomes the inheritor)', 'run'); const o5 = await send(crew.boat, await P.finish(lost32, 0)); step(5, 'Inheritor set', 'ok', { explorer: o5.explorer });
        step(6, 'Bring it home: one signature moves everything', 'run');
        const o6 = await send(crew.boat, await P.bringHome(lost32, twinOf(crew.boat.address), [{ kind: 'native', keepAlive: false }]));
        step(6, 'Brought home', 'ok', { explorer: o6.explorer, items: o6.items, controlResult: o6.controlResult });
        step(7, 'Receipt', 'ok', { moved: `${formatEther(await evmProvider.getBalance(crew.boat.address))} tPOT now on the new phone`, txBlocks: [o1.block, o2.block, o3.block, o5.block, o6.block] });
        emit({ done: true });
      } catch (e: any) { emit({ error: String(e?.message ?? e), honest: 'This is a real failure from a live drill. It is shown, not hidden.' }); }
      finally { await store.set('kedge:drill:lock', '0'); ctl.close(); }
    },
  });
  return new Response(stream, { headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive' } });
}
