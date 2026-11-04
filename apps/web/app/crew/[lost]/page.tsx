'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { isAddress, getAddress } from 'ethers';
import { connect, calls, sendCall, trace, rpc, short } from '@/lib/client';
import { twinOf } from '@/lib/kedge/twin';
import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';
import { callPhrase, phraseMatches } from '@/lib/kedge/phrase';
import { refuseContractInheritor, KedgeRefusal } from '@/lib/kedge/mate';
import { PrimaryButton, Notice, GlowCard, Receipt } from '@/components/ui';
import { Flag } from '@/components/art';

export default function CrewDoor() {
  const { lost } = useParams<{ lost: string }>(); const q = useSearchParams(); const gi = Number(q.get('group') ?? 0);
  const [me, setMe] = useState(''); const [view, setView] = useState<any>(null); const [words, setWords] = useState(['', '', '', '']); const [note, setNote] = useState<{ tone: 'info' | 'refusal'; t: string } | null>(null);
  const [rows, setRows] = useState<any[]>([]); const [busy, setBusy] = useState(false); const [refusal, setRefusal] = useState<string | null>(null);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  useEffect(() => { if (!isAddress(lost)) return; fetch(`/api/lookout?lost=${lost}`).then((r) => r.json()).then(setView).catch(() => setNote({ tone: 'refusal', t: 'Could not read the chain. Try again.' })); }, [lost]);
  const group = view?.groups?.[gi]; const heirSs58: string | undefined = group?.inheritor;
  const heir32 = useMemo(() => { if (!heirSs58) return null; try { return decodeAddress(heirSs58); } catch { return null; } }, [heirSs58]);
  const expected = useMemo(() => (isAddress(lost) && heir32 ? callPhrase(twinOf(lost), heir32, gi) : null), [lost, heir32, gi]);
  useEffect(() => { (async () => { if (!heir32) return; try { await refuseContractInheritor(heir32, (a) => rpc('eth_getCode', [a, 'latest'])); setRefusal(null); } catch (e: any) { setRefusal(e instanceof KedgeRefusal ? e.message : null); } })(); }, [heir32]);
  const isGuardian = !!(me && group && group.friends.includes(encodeAddress(twinOf(me), 42)));
  const matches = !!expected && phraseMatches(words.join(' '), expected);
  const att = view?.attempts?.find((a: any) => a.groupIndex === gi);
  const act = async () => { setBusy(true); setNote(null); try { const hash = await sendCall(me, att ? calls.approve(lost, gi) : calls.initiate(lost, gi)); setRows([{ label: att ? 'Approval sent' : 'Attempt started', status: 'wait', detail: short(hash) }]); const o = await trace(hash);
      setRows([{ label: att ? 'Approve attempt' : 'Start attempt', status: o.extrinsicFailed ? 'failed' : 'ok', detail: o.errorName ?? `block ${o.block}`, href: o.explorer }]); const v = await (await fetch(`/api/lookout?lost=${lost}`)).json(); setView(v); } catch (e: any) { setNote({ tone: 'refusal', t: e.message }); } setBusy(false); };
  const paste = (e: React.ClipboardEvent) => { const t = e.clipboardData.getData('text').trim().split(/\s+/); if (t.length === 4) { e.preventDefault(); setWords(t); } };
  if (!isAddress(lost)) return <Notice tone="refusal">That is not a wallet address. Ask your friend to send it again.</Notice>;
  return (<div className="space-y-6">
    <header><p className="micro text-brass">Guardian</p><h1 className="display h1">Crew door</h1><p className="mt-2">You are being asked to help bring back <span className="mono">{getAddress(lost)}</span>.</p></header>
    {!group && view && <Notice tone="refusal">This wallet has no crew set up. Nothing can be done from here, and Kedge will not guess.</Notice>}
    {refusal && <Notice tone="refusal"><strong>Stop.</strong> {refusal}</Notice>}
    {me && group && !isGuardian && <Notice tone="refusal">Your wallet <span className="mono">{short(me)}</span> is not one of this crew&apos;s guardians. The chain would refuse you (NotFriend).</Notice>}
    {group && (<GlowCard className="p-6"><h2 className="display h3">Step 1. Call them and hear four words</h2>
      <p className="mt-1 text-sm">Do not use a message. Call the person on a voice or video call. Ask them to read the four words shown in their Kedge app. Type them here.</p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4" onPaste={paste}>{words.map((w, i) => (<label key={i}><span className="sr-only">Word {i + 1}</span><input ref={(el) => { refs.current[i] = el; }} value={w} onChange={(e) => { const n = [...words]; n[i] = e.target.value.trim(); setWords(n); if (/\s$/.test(e.target.value)) refs.current[i + 1]?.focus(); }} autoCapitalize="none" autoCorrect="off" spellCheck={false} className="mono min-h-[48px] w-full rounded-xl border-2 border-ink/30 bg-white px-3 text-center text-lg" /></label>))}</div>
      <p className="mt-3 text-sm" aria-live="polite">{words.every(Boolean) ? (matches ? 'The words match what this rescue shows.' : 'These words do not match. Do not approve. Someone may be sending you a different link.') : 'Waiting for four words.'}</p>
      <p className="mt-1 text-xs text-ink/70">This check helps you catch a scam. The chain itself enforces the number of approvals and the delay.</p></GlowCard>)}
    {group && (<GlowCard className="p-6"><h2 className="display h3">Step 2. {att ? 'Approve' : 'Start the rescue'}</h2>
      <p className="mt-1 text-sm">{att ? 'Approving counts as one of the votes needed. After the safety delay the new phone can finish the rescue. You decide once.' : 'Starting counts as your approval. A second guardian must also approve.'}</p>
      {att && <div className="mt-3 flex gap-2" aria-label="Approvals so far">{group.friends.map((_: string, i: number) => <Flag key={i} letter={String.fromCharCode(65 + i)} on={att.approvedIndexes.includes(i)} />)}</div>}
      <div className="mt-4 flex flex-wrap gap-3">{!me ? <PrimaryButton onClick={async () => setMe(getAddress(await connect()))}>Connect wallet</PrimaryButton>
        : <PrimaryButton ready={matches && isGuardian} disabled={!matches || !isGuardian || !!refusal || busy} onClick={act}>{att ? 'Approve' : 'Start'}</PrimaryButton>}</div>
      {!matches && <p className="mt-2 text-sm text-ink/80">The button unlocks when the four words match.</p>}</GlowCard>)}
    {note && <Notice tone={note.tone}>{note.t}</Notice>}{rows.length > 0 && <Receipt rows={rows} />}
  </div>);
}
