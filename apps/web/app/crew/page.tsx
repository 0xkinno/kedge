'use client';
import { useState } from 'react';
import { isAddress } from 'ethers';
import { useRouter } from 'next/navigation';
import { PrimaryButton } from '@/components/ui';
export default function CrewIndex() {
  const [v, setV] = useState(''); const r = useRouter();
  return (<div className="space-y-4"><p className="micro text-brass">Guardian</p><h1 className="display h1">Crew door</h1>
    <p className="max-w-xl">A friend asked you to help bring a wallet back? Paste the wallet address they gave you.</p>
    <label className="block"><span className="micro">Wallet to rescue</span><input value={v} onChange={(e) => setV(e.target.value)} placeholder="0x..." className="mono mt-1 block min-h-[44px] w-full max-w-xl rounded-xl border border-ink/30 bg-white/80 px-3" /></label>
    <PrimaryButton disabled={!isAddress(v)} onClick={() => r.push(`/crew/${v}`)}>Open the crew door</PrimaryButton></div>);
}
