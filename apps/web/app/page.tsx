import facts from '@/data/FACTS.json';
import figures from '@/data/landing_figures.json';
import Link from 'next/link';
import { AnchorRope, LifeboatCard, SignalFlagK, HourglassAnchor, CompassRose, Lifebuoy, PhoneOverboard, RopeDivider } from '@/components/art';
import { GlowCard, Reveal, LinkButton } from '@/components/ui';

const m = facts.measured;
const stats = [
  [`${m.rescuesCompleted} of ${m.rescuesAttempted}`, 'rescues completed on testnet'],
  [`${m.attacksStopped} of ${m.attacksTried}`, 'attacks stopped, each with a decoded refusal'],
  [String(m.legitimateRescuesWronglyBlocked), 'legitimate rescues wrongly blocked'],
  [`${m.costPerRescueTPOT} tPOT`, 'in fees per rescue'],
];
export default function Home() {
  return (<>
    <section aria-labelledby="hero" className="relative grid items-center gap-8 py-8 md:grid-cols-[1.05fr_1fr] md:py-14" data-tour="hero">
      <div className="chart-contours pointer-events-none absolute inset-0 -z-10" />
      <div>
        <p className="micro flex items-center gap-2 text-ink/80"><span className="live-dot" aria-hidden="true" /> Live on Portaldot V3 testnet</p>
        <h1 id="hero" className="display hero-display mt-4">Lose the phone. Not the wages.</h1>
        <p className="serif mt-4 text-3xl text-deep-water">03:40, anchorage off Singapore.</p>
        <p className="mt-5 max-w-[34rem] text-lg">When a seafarer&apos;s phone goes overboard, Kedge lets his crew and family bring his wallet back, using Portaldot&apos;s built-in Recovery pallet, signed from the MetaMask he already has.</p>
        <div className="mt-7 flex flex-wrap gap-3"><LinkButton primary href="/drill">Run a rescue drill</LinkButton><LinkButton href="/harbour">Protect my wallet</LinkButton></div>
        <dl className="mt-9 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">{stats.map(([v, l]) => (<div key={l}><dt className="sr-only">{l}</dt><dd className="display text-3xl text-deep-water">{v}</dd><dd className="text-sm text-ink/80">{l}</dd></div>))}</dl>
      </div>
      <div className="relative min-h-[360px] md:min-h-[520px]">
        <div className="absolute inset-0 overflow-hidden rounded-[28px] border border-fog [mask-image:linear-gradient(90deg,transparent_0%,#000_22%)]" aria-hidden="true">
          <div className="h-full w-full bg-[linear-gradient(180deg,#f9d9bf_0%,#f6e6d1_45%,#bfe1db_46%,#8fc9c1_100%)]" />
          <svg viewBox="0 0 400 300" className="absolute inset-x-0 bottom-0 h-3/4 w-full"><path d="M0 190h400v110H0z" fill="#8fc9c1" opacity=".6" /><path d="M70 150h210l18-26H98z" fill="#123B52" /><path d="M120 124v-24h30v24z" fill="#0C2536" /><path d="M0 200c40-10 60 10 100 0s60 10 100 0 60 10 100 0 60 10 100 0" fill="none" stroke="#F6F1E7" strokeWidth="2" opacity=".7" /></svg>
          <AnchorRope className="absolute bottom-4 left-[22%] h-40 w-40 md:h-52 md:w-52" />
        </div>
        <GlowCard className="absolute -bottom-4 left-0 w-[min(300px,88%)] p-4 shadow-lg" >
          <p className="micro text-ink/70">Rescue card, from the drill</p>
          <ul className="mt-2 space-y-1 text-sm"><li>Guardians: 2 of 3 approved</li><li>Safety delay: {m.delayBlocks} blocks, about {m.delaySecondsMeasured} s</li>
            <li className="font-semibold text-[#0b6b61]">Brought home: {m.tpotMoved} tPOT, {m.kusdMoved} kUSD, 1 vault</li></ul>
        </GlowCard>
        <p className="mt-2 text-xs text-ink/70 md:absolute md:-bottom-8 md:right-0">Illustration. A photograph is planned.</p>
      </div>
    </section>

    <section aria-labelledby="moment" className="mt-24 rounded-[28px] bg-paper-deep/70 p-6 md:p-12">
      <Reveal><p className="micro text-brass">Fictional seafarer. Real mechanism.</p>
        <h2 id="moment" className="display h2 mt-2">Seven months into a nine-month contract.</h2>
        <blockquote className="serif mt-6 max-w-3xl text-4xl leading-tight text-deep-water">His phone slipped out of his coverall pocket and went over the side. His savings were on it.</blockquote></Reveal>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {[['Port wifi is 9 days away.', 'He calls home on the ship&apos;s satellite line. His seed phrase is on a scrap of paper in a drawer in Iloilo, or nowhere.'], ['A wallet has no "forgot password".', 'Custodial apps want identity checks from a ship with no signal. A company-run seed backup means handing his keys to a company.'], ['The next allotment is due in 12 days.', 'Lorna runs the house. Ana is a nurse in Dubai. Ben is the bosun. Together they are the crew.']].map(([t, b]) => (<Reveal key={t}><h3 className="display h3">{t}</h3><p className="mt-2 text-ink/90" dangerouslySetInnerHTML={{ __html: b }} /></Reveal>))}
      </div>
      <p className="mt-8 border-t border-fog pt-4 text-sm">{figures.money.sentence} <a className="underline underline-offset-4" href={figures.money.sourceUrl} target="_blank" rel="noreferrer">BusinessWorld, citing BSP data<span className="sr-only"> (opens in a new tab)</span></a>. More sources, with the exact quotes, in <a className="underline underline-offset-4" href="https://github.com/0xkinno/kedge/blob/main/docs/sources.json">sources.json</a>.</p>
    </section>

    <section aria-labelledby="how" className="mt-24">
      <h2 id="how" className="display h2">How a rescue works</h2>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[[LifeboatCard, '1', 'Lifeboat Card', 'Ramon names his crew once and prints a wallet-size card. The card alone cannot move a cent.'], [SignalFlagK, '2', 'The call phrase', 'Guardians hear four words on a call and type them before approving. A scam link shows different words.'], [HourglassAnchor, '3', 'The safety delay', 'Two guardians approve, then the chain makes everyone wait. Ramon can stop any attempt he did not start.'], [AnchorRope, '4', 'Bring it home', 'One signature from the new phone moves everything to the new key.']].map(([Icon, n, t, b]: any) => (
          <Reveal key={t}><GlowCard className="h-full p-6"><Icon className="mx-auto h-24 w-24" /><p className="micro mt-3 text-brass">Step {n}</p><h3 className="display h3 mt-1">{t}</h3><p className="mt-2 text-sm text-ink/90">{b}</p></GlowCard></Reveal>))}
      </div>
    </section>

    <section aria-labelledby="home" className="mt-24">
      <h2 id="home" className="display h2">What comes home</h2>
      <p className="mt-2 max-w-2xl text-ink/90">One signature, three kinds of savings, from three different parts of Portaldot.</p>
      <div className="relative mt-8 grid gap-5 md:grid-cols-3">
        {[['tPOT', 'Native coin', 'Moved by the balances pallet.'], ['kUSD', 'Native asset', 'Moved by the assets pallet. Our test dollar (asset 20261104).'], ['Allotment savings', 'Solidity contract', 'Paid out by the vault, which sees the old address as the sender.']].map(([t, k, d]) => (<Reveal key={t}><GlowCard className="h-full p-6"><Lifebuoy className="h-14 w-14" /><h3 className="display h3 mt-3">{t}</h3><p className="micro text-brass">{k}</p><p className="mt-2 text-sm">{d}</p></GlowCard></Reveal>))}
      </div>
      <p className="mt-5 text-sm text-ink/80">Moved in one transaction with <code className="mono">utility.force_batch</code>, so one stuck item never blocks the rest.</p>
    </section>

    <section aria-labelledby="why" className="mt-24 rounded-[28px] bg-deep-water p-6 text-paper md:p-12">
      <h2 id="why" className="display h2">Why only Portaldot</h2>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-white/20 p-5"><p className="micro text-brass">Other EVM chains</p><p className="mt-2">A MetaMask address is the key. No key, no wallet. Funds sit at an address nobody can sign for.</p></div>
        <div className="rounded-2xl border border-lifejacket/60 p-5"><p className="micro text-lifejacket">Portaldot V3</p><p className="mt-2">Every MetaMask address has a native twin account. The twin can use the chain&apos;s own Recovery pallet, so the people it trusts can act as it after a delay. We measured this on testnet; <Link className="underline underline-offset-4" href="/proof">verify it yourself</Link>.</p></div>
      </div>
      <p className="mt-6 text-sm text-paper/80">Delete Portaldot and step 5 fails: there is nothing for the guardians to approve.</p>
    </section>

    <section aria-labelledby="stop" className="mt-24 grid items-center gap-8 md:grid-cols-2">
      <div><h2 id="stop" className="display h2">Stop a thief</h2><p className="mt-3">Ramon gets one message when someone starts an attempt on his wallet. If it was not his crew, he can stop it or punish the starter before the delay ends.</p>
        <p className="mt-2 text-sm text-ink/80">Honest limit: on this testnet the security deposit is zero, so a bad starter risks only fees. The chain still requires two guardians and the delay.</p></div>
      <GlowCard className="mx-auto w-full max-w-sm p-5"><PhoneOverboard className="mx-auto h-20 w-20" /><p className="mt-2 text-sm">An attempt started on your wallet by 5Hf3...gh. Finishable in about 60 seconds.</p><div className="mt-3 flex gap-2"><span className="rounded-lg bg-lifejacket px-3 py-2 text-sm font-semibold text-white">Stop</span><span className="rounded-lg border border-ink/30 px-3 py-2 text-sm">Slash</span></div></GlowCard>
    </section>

    <section aria-labelledby="proof" className="mt-24">
      <h2 id="proof" className="display h2">Proof</h2>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-fog bg-white/60"><table className="w-full min-w-[560px] text-left text-sm"><caption className="sr-only">Campaign results generated from testnet receipts</caption>
        <thead><tr className="border-b border-fog"><th scope="col" className="p-3">Scenario</th><th scope="col" className="p-3">Result</th><th scope="col" className="p-3">Block</th></tr></thead>
        <tbody>{facts.scenarios.map((s) => (<tr key={s.id} className="border-b border-fog/60 align-top"><th scope="row" className="p-3 font-medium">{s.id}: {s.title}</th><td className="p-3">{s.pass ? 'As expected' : 'Missed'}{s.observed ? <span className="mono ml-2 text-ink/70">{String(s.observed)}</span> : null}</td><td className="p-3">{s.proofTx ? <a className="underline underline-offset-4" href={s.proofTx.explorer} target="_blank" rel="noreferrer">{s.proofTx.block}<span className="sr-only"> (opens in a new tab)</span></a> : 'n/a'}</td></tr>))}</tbody></table></div>
      <div className="mt-5"><LinkButton href="/proof">Verify it yourself</LinkButton></div>
    </section>

    <section aria-labelledby="crews" className="mt-24 flex flex-col items-start gap-6 md:flex-row md:items-center"><CompassRose className="h-24 w-24 shrink-0" />
      <div><h2 id="crews" className="display h2">For crews and agencies</h2><p className="mt-2 max-w-2xl">Free for individuals. Manning agencies and seafarer welfare groups reach crews at scale. Wallet makers can add a one-call protection kit, because every Portaldot account is recoverable the same way.</p></div></section>
    <RopeDivider className="mt-16 h-6 w-full max-w-[480px]" />
  </>);
}
