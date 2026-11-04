'use client';
import { useState } from 'react';
import { isAddress } from 'ethers';
import { useRouter } from 'next/navigation';
import { PrimaryButton } from '@/components/ui';
export default function RescueIndex() {
  const [v, setV] = useState(''); const r = useRouter();
  return (<div className="space-y-4"><p className="micro text-brass-ink">New phone</p><h1 className="display h1">Rescue</h1>
    <p className="max-w-xl">Paste the address of the wallet you lost. You will see who approved, how long the safety delay has left, and what will move.</p>
    <label className="block"><span className="micro">Lost wallet address</span><input value={v} onChange={(e) => setV(e.target.value)} placeholder="0x..." className="mono mt-1 block min-h-[44px] w-full max-w-xl rounded-xl border border-ink/30 bg-white/80 px-3" /></label>
    <PrimaryButton disabled={!isAddress(v)} onClick={() => r.push(`/rescue/${v}`)}>Open the rescue</PrimaryButton></div>);
}
