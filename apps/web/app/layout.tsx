import type { Metadata } from 'next';
import { Bricolage_Grotesque, Instrument_Serif, Hanken_Grotesk, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Nav from '@/components/Nav';
import { RopeDivider } from '@/components/art';
import { Suspense } from 'react';
import Tour from '@/components/Tour';
import Smooth from '@/components/Smooth';

const display = Bricolage_Grotesque({ subsets: ['latin'], weight: ['700', '800'], variable: '--font-bricolage', display: 'swap' });
const serif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: ['normal', 'italic'], variable: '--font-instrument', display: 'swap' });
const body = Hanken_Grotesk({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-hanken', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-jetbrains', display: 'swap' });

export const metadata: Metadata = {
  title: 'Kedge: bring a lost wallet back on Portaldot',
  description: 'When a seafarer\'s phone goes overboard, Kedge lets his crew and family bring his wallet back, using Portaldot\'s built-in Recovery pallet, signed from the MetaMask he already has.',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${serif.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <a className="skip" href="#main">Skip to content</a>
        <Nav />
        <Smooth />
        <Suspense fallback={null}><Tour /></Suspense>
        <main id="main" className="mx-auto w-full max-w-[1200px] px-4 pb-28 pt-24 md:pb-16">{children}</main>
        <footer className="mx-auto w-full max-w-[1200px] px-4 pb-28 md:pb-10">
          <RopeDivider className="mb-6 h-6 w-full max-w-[480px]" />
          <p className="text-sm text-ink/80">Kedge. Portaldot Hacker House 2026, Ecosystem DApps. Ramon, Lorna, Ana and Ben are fictional; the mechanism is real and runs on testnet. House crew keys sign drills only. The hero image is AI-generated.</p>
          <p className="mt-2 text-sm text-ink/80"><a className="underline underline-offset-4" href="/proof">Proof</a> · <a className="underline underline-offset-4" href="/judge">For judges</a> · <a className="underline underline-offset-4" href="/api/status">Status</a> · <a className="underline underline-offset-4" href="https://github.com/0xkinno/kedge">Source</a></p>
        </footer>
      </body>
    </html>
  );
}
