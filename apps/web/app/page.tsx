import facts from '@/data/FACTS.json';
import figures from '@/data/landing_figures.json';
import Link from 'next/link';
import { LifeboatCard, SignalFlagK, HourglassAnchor, AnchorRope, CompassRose, Lifebuoy, PhoneOverboard, RopeDivider, SeamansBook } from '@/components/art';
import { GlowCard, Reveal, LinkButton } from '@/components/ui';
import ChainPulse from '@/components/ChainPulse';
import { fmtTpot } from '@/lib/fmt';

const m = facts.measured;
const stats = [
  [`${m.rescuesCompleted} of ${m.rescuesAttempted}`, 'rescues completed on testnet'],
  [`${m.attacksStopped} of ${m.attacksTried}`, 'attacks stopped, on chain or by the checks'],
  [String(m.legitimateRescuesWronglyBlocked), 'honest rescues wrongly blocked'],
  [fmtTpot(m.costPerRescueTPOT), 'tPOT in fees per rescue'],
];
const Section = ({ id, label, title, children, className = '' }: { id: string; label: string; title: string; children: React.ReactNode; className?: string }) => (
  <section aria-labelledby={id} className={`mt-28 ${className}`}><Reveal><p className="micro text-brass-ink">{label}</p><h2 id={id} className="display h2 mt-2 max-w-3xl">{title}</h2></Reveal>{children}</section>
);

export default function Home() {
  return (<>
    {/* ===== Hero: copy left 42%, image right 58% with the left-to-right paper fade ===== */}
    <section aria-labelledby="hero" className="hero-grid relative pt-2" data-tour="hero">
      <div className="chart-contours pointer-events-none absolute inset-0 -z-10" />
      <div className="relative z-10 lg:pr-8">
        <p className="micro flex items-center gap-2 text-ink/80"><span className="live-dot" aria-hidden="true" /> Live on Portaldot V3 testnet</p>
        <h1 id="hero" className="display hero-title mt-4"><span className="block">Lose the phone.</span><span className="block text-deep-water">Not the wages.</span></h1>
        <p className="serif mt-4 text-[28px] leading-tight text-deep-water">03:40, anchorage off Singapore.</p>
        <p className="mt-5 max-w-[32rem] text-[18px]">When a seafarer&apos;s phone goes overboard, Kedge lets his crew and family bring his wallet back, using Portaldot&apos;s built-in Recovery pallet, signed from the MetaMask he already has.</p>
        <div className="mt-7 flex flex-wrap gap-3"><LinkButton primary href="/drill">Run a rescue drill</LinkButton><LinkButton href="/harbour">Protect my wallet</LinkButton></div>
      </div>
      <div className="hero-media" data-key="hero-media">
        <picture>
          <source media="(max-width: 1023px)" srcSet="/hero/harbour-dawn-mobile.webp" />
          <img src="/hero/harbour-dawn.webp" alt="A bulk carrier at anchor in dawn haze, with a weathered kedge anchor and coiled mooring rope on a wooden dock in the foreground" width={1376} height={768} fetchPriority="high" />
        </picture>
        {/* The rope draws from the Rescue Card to the anchor's ring once on load. Uniform viewBox = photo aspect, so it lands exactly. */}
        <svg aria-hidden="true" viewBox="0 0 1376 768" preserveAspectRatio="xMidYMid slice" className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block">
          <path className="rope" pathLength={1} d="M150 330 C 170 600, 560 640, 826 452" fill="none" stroke="#FF5A1F" strokeWidth="3.2" strokeLinecap="round" />
          <circle cx="826" cy="452" r="6" fill="#FF5A1F" />
        </svg>
        <div className="absolute left-[4%] top-[6%] z-10 w-[min(250px,40%)] max-lg:left-3 max-lg:top-3 max-lg:w-[min(250px,72%)]">
          <GlowCard className="p-4 shadow-xl">
            <p className="micro text-ink/70">Rescue card, from the drill</p>
            <ul className="mt-2 space-y-1 text-[13px] leading-snug">
              <li>Guardians <b>2 of 3</b> approved</li>
              <li>Safety delay <b>{m.delayBlocks} blocks</b>, about {m.delaySecondsMeasured} s</li>
              <li className="pt-1 font-semibold text-[#0b6b61]">Brought home: {m.tpotMoved} tPOT, {m.kusdMoved} kUSD, 1 vault</li>
            </ul>
          </GlowCard>
        </div>
      </div>
    </section>

    <div className="mt-10 grid gap-4 lg:grid-cols-[1.1fr_2fr]">
      <ChainPulse />
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">{stats.map(([v, l]) => (<div key={l} className="stat-card rounded-xl p-3"><dd className="numeral text-3xl text-deep-water">{v}</dd><dt className="mt-0.5 text-[13px] leading-snug text-ink/80">{l}</dt></div>))}</dl>
    </div>

    {/* ===== The moment ===== */}
    <section aria-labelledby="moment" className="mt-28 grid gap-8 rounded-[28px] bg-paper-deep/70 p-6 md:grid-cols-[1.2fr_1fr] md:p-12">
      <Reveal>
        <p className="micro text-brass-ink">Fictional seafarer. Real mechanism.</p>
        <h2 id="moment" className="display h2 mt-2">Seven months into a nine-month contract.</h2>
        <blockquote className="serif mt-6 text-[40px] leading-[1.08] text-deep-water">His phone slipped out of his coverall pocket and went over the side. His savings were on it.</blockquote>
        <p className="mt-6 max-w-xl">A wallet has no &quot;forgot password&quot;. Custodial apps want identity checks from a ship with no signal, and a company-run seed backup means handing his keys to a company.</p>
      </Reveal>
      <Reveal delay={0.1}>
        <div className="flex h-full flex-col justify-between gap-6 rounded-2xl border border-fog bg-white/60 p-6">
          <div className="flex items-center gap-4"><PhoneOverboard className="h-20 w-20 shrink-0" /><p className="numeral text-6xl text-deep-water">03:40</p></div>
          <ul className="space-y-3 text-[15px]"><li className="flex gap-3"><span className="micro mt-1 w-14 shrink-0 text-brass-ink">Ben</span>Bosun on his ship. A guardian.</li><li className="flex gap-3"><span className="micro mt-1 w-14 shrink-0 text-brass-ink">Lorna</span>His wife, running the house in Iloilo.</li><li className="flex gap-3"><span className="micro mt-1 w-14 shrink-0 text-brass-ink">Ana</span>His sister, a nurse in Dubai.</li></ul>
          <p className="border-t border-fog pt-3 text-[13px] text-ink/80">{figures.money.sentence} <a className="underline underline-offset-4" href={figures.money.sourceUrl} target="_blank" rel="noreferrer">BusinessWorld, citing BSP data<span className="sr-only"> (opens in a new tab)</span></a></p>
        </div>
      </Reveal>
    </section>

    {/* ===== How a rescue works ===== */}
    <Section id="how" label="Four steps" title="How a rescue works">
      <div className="relative mt-10">
        <svg aria-hidden="true" viewBox="0 0 1000 12" preserveAspectRatio="none" className="pointer-events-none absolute left-[6%] right-[6%] top-[58px] hidden h-3 w-[88%] lg:block"><path className="flow" d="M0 6 H1000" stroke="#B88A2E" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke" /></svg>
        <div className="relative grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[[LifeboatCard, '1', 'Lifeboat Card', 'Ramon names his crew once and prints a wallet-size card. The card alone cannot move a cent.'], [SignalFlagK, '2', 'The call phrase', 'A guardian hears four words on a call and types them before approving. A scam link shows different words.'], [HourglassAnchor, '3', 'The safety delay', 'Two guardians approve, then the chain makes everyone wait. Ramon can stop any attempt he did not start.'], [AnchorRope, '4', 'Bring it home', 'One signature from the new phone moves everything to the new key.']].map(([Icon, n, t, b]: any, i) => (
            <Reveal key={t} delay={i * 0.06}><GlowCard className="h-full p-6"><div className="mx-auto flex h-[112px] w-[112px] items-center justify-center rounded-full border border-fog bg-paper"><Icon className="h-20 w-20" /></div><p className="micro mt-4 text-brass-ink">Step {n}</p><h3 className="display h3 mt-1">{t}</h3><p className="mt-2 text-[15px] text-ink/90">{b}</p></GlowCard></Reveal>))}
        </div>
      </div>
    </Section>

    {/* ===== What comes home ===== */}
    <Section id="home" label="One signature" title="What comes home">
      <div className="relative mt-10 grid gap-5 md:grid-cols-3">
        <svg aria-hidden="true" viewBox="0 0 1000 12" preserveAspectRatio="none" className="pointer-events-none absolute left-[10%] right-[10%] top-[44px] hidden h-3 w-[80%] md:block"><path className="flow" d="M0 6 H1000" stroke="#FF5A1F" strokeWidth="2.4" fill="none" vectorEffect="non-scaling-stroke" /></svg>
        {[['tPOT', 'Native coin', 'Moved by the balances pallet.'], ['kUSD', 'Native asset', 'Moved by the assets pallet. Kedge\'s own test dollar, asset 20261104.'], ['Allotment savings', 'Solidity contract', 'Paid out by the vault, which sees the old address as the sender.']].map(([t, k, d], i) => (
          <Reveal key={t} delay={i * 0.06}><GlowCard className="h-full p-6"><div className="flex h-[88px] w-[88px] items-center justify-center rounded-full border border-fog bg-paper"><Lifebuoy className="h-14 w-14" /></div><h3 className="display h3 mt-4">{t}</h3><p className="micro text-brass-ink">{k}</p><p className="mt-2 text-[15px]">{d}</p></GlowCard></Reveal>))}
      </div>
      <p className="mt-6 text-sm text-ink/80">All three move in one transaction using <code className="mono">utility.force_batch</code>, so one stuck item never blocks the rest.</p>
    </Section>

    {/* ===== Why only Portaldot ===== */}
    <section aria-labelledby="why" className="mt-28 rounded-[28px] bg-deep-water p-6 text-paper md:p-12">
      <h2 id="why" className="display h2">Why only Portaldot</h2>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-white/20 p-6"><p className="micro text-brass-light">Other EVM chains</p>
          <svg viewBox="0 0 320 90" className="mt-4 w-full" role="img" aria-label="A MetaMask address with no seed has no way back"><rect x="8" y="22" width="120" height="46" rx="8" fill="none" stroke="#F6F1E7" strokeWidth="2" /><text x="68" y="50" textAnchor="middle" fill="#F6F1E7" fontSize="12" fontFamily="monospace">0x85fb...a816</text><path d="M134 45 H214" stroke="#D3263C" strokeWidth="2" strokeDasharray="5 5" /><path d="M196 33l18 24M214 33l-18 24" stroke="#D3263C" strokeWidth="3" strokeLinecap="round" /><text x="256" y="49" textAnchor="middle" fill="#F6F1E7" fontSize="12">no way back</text></svg>
          <p className="mt-3">The address is the key. No key, no wallet. The funds sit where nobody can sign.</p></div>
        <div className="rounded-2xl border border-lifejacket/60 p-6"><p className="micro text-lifejacket-light">Portaldot V3</p>
          <svg viewBox="0 0 320 90" className="mt-4 w-full" role="img" aria-label="A MetaMask address maps to a native twin that the Recovery pallet can act for"><rect x="4" y="26" width="84" height="38" rx="8" fill="none" stroke="#F6F1E7" strokeWidth="2" /><text x="46" y="49" textAnchor="middle" fill="#F6F1E7" fontSize="11" fontFamily="monospace">0x85fb..</text><path d="M90 45 H112" stroke="#FF8A5C" strokeWidth="2" /><rect x="112" y="26" width="92" height="38" rx="8" fill="none" stroke="#FF8A5C" strokeWidth="2" /><text x="158" y="42" textAnchor="middle" fill="#F6F1E7" fontSize="10">twin account</text><text x="158" y="56" textAnchor="middle" fill="#F6F1E7" fontSize="10" fontFamily="monospace">..EEEEEE</text><path d="M206 45 H226" stroke="#FF8A5C" strokeWidth="2" /><rect x="226" y="26" width="90" height="38" rx="8" fill="#FF5A1F" /><text x="271" y="49" textAnchor="middle" fill="#0C2536" fontSize="11" fontWeight="700">Recovery</text></svg>
          <p className="mt-3">Every MetaMask address has a native twin. The twin can use the chain&apos;s own Recovery pallet, so the people it trusts can act as it after a delay. Measured on testnet; <Link className="underline underline-offset-4" href="/proof">verify it yourself</Link>.</p></div>
      </div>
      <p className="mt-6 text-sm text-paper">Delete Portaldot and step 5 fails: there is nothing for the guardians to approve.</p>
    </section>

    {/* ===== Stop a thief ===== */}
    <section aria-labelledby="stop" className="mt-28 grid items-center gap-10 md:grid-cols-2">
      <Reveal><p className="micro text-brass-ink">The watch</p><h2 id="stop" className="display h2 mt-2">Stop a thief</h2><p className="mt-3">Ramon gets one message when someone starts an attempt on his wallet. If it was not his crew, he can stop it or punish the starter before the delay ends.</p>
        <p className="mt-3 text-sm text-ink/80">Honest limit: on this testnet the security deposit is zero, so a bad starter risks only fees. The chain still requires two guardians and the delay.</p></Reveal>
      <Reveal delay={0.1}><GlowCard className="mx-auto w-full max-w-sm p-5"><div className="flex items-center gap-3"><PhoneOverboard className="h-14 w-14" /><p className="micro text-ink/70">Kedge alert</p></div><p className="mt-3 text-[15px]">An attempt started on your wallet by 5Hf3...gh. Finishable in about 60 seconds.</p><div className="mt-4 flex gap-2"><span className="btn-primary inline-flex min-h-[44px] items-center rounded-xl px-4 font-semibold">Stop it</span><span className="btn-ghost inline-flex min-h-[44px] items-center rounded-xl px-4">Slash</span></div></GlowCard></Reveal>
    </section>

    {/* ===== Proof ===== */}
    <Section id="proof" label="Generated from receipts" title="Proof you can open">
      <div className="relative mt-8 overflow-x-auto rounded-2xl border border-fog bg-white/60"><table className="w-full min-w-[560px] text-left text-sm"><caption className="sr-only">Campaign results generated from testnet receipts</caption>
        <thead><tr className="border-b border-fog"><th scope="col" className="p-3">Scenario</th><th scope="col" className="p-3">Result</th><th scope="col" className="p-3">Block</th></tr></thead>
        <tbody>{facts.scenarios.map((s) => (<tr key={s.id} className="border-b border-fog/60 align-top"><th scope="row" className="p-3 font-medium">{s.id}: {s.title}</th><td className="p-3">{s.pass ? 'As expected' : 'Missed'}{s.observed ? <span className="mono ml-2 text-ink/70">{String(s.observed)}</span> : null}</td><td className="p-3">{s.proofTx ? <a className="underline underline-offset-4" href={s.proofTx.explorer} target="_blank" rel="noreferrer">{s.proofTx.block}<span className="sr-only"> (opens in a new tab)</span></a> : 'guard'}</td></tr>))}</tbody></table></div>
      <div className="mt-6"><LinkButton href="/proof">Verify it yourself</LinkButton></div>
    </Section>

    <section aria-labelledby="crews" className="mt-28 grid items-center gap-6 rounded-[28px] border border-fog bg-white/50 p-6 md:grid-cols-[auto_1fr] md:p-10"><CompassRose className="h-24 w-24" />
      <div><h2 id="crews" className="display h2">For crews and agencies</h2><p className="mt-2 max-w-2xl">Free for individuals. Manning agencies and seafarer welfare groups reach crews at scale. Wallet makers can add a one-call protection flow, because every Portaldot account is recoverable the same way.</p>
        <div className="mt-4 flex items-center gap-3"><SeamansBook className="h-12 w-12" /><span className="text-sm text-ink/80">Kept with the passport and Seaman&apos;s Book.</span></div></div></section>
    <RopeDivider className="mt-16 h-6 w-full max-w-[480px]" />
  </>);
}
