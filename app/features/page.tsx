'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import {
  MessageSquareWarning,
  Link2,
  Mail,
  ShieldAlert,
  ShieldCheck,
  Fingerprint,
  History,
  FileText,
  Zap,
  Check,
} from 'lucide-react';

const CORE_FEATURES = [
  {
    icon: MessageSquareWarning,
    title: 'Message & DM detection',
    description:
      'Paste an SMS, WhatsApp, or DM and Custos reads it the way a scammer wrote it — urgency cues, fake giveaways, impersonation language — then hands back a plain-English verdict in seconds.',
    points: [
      'Detects urgency and threat language ("act now", "account suspended")',
      'Flags impersonation of banks, couriers, and government bodies',
      'Cross-checks phone numbers and sender IDs against known patterns',
    ],
    sample: {
      kind: 'SMS',
      from: '+92 21 111 222 333 · "HBLBank"',
      body: 'HBL Alert: Your debit card has been temporarily blocked due to unusual activity. Verify now to avoid permanent suspension: hbl-verify-secure.com/auth',
      verdict: 'scam' as const,
      score: 97,
    },
  },
  {
    icon: Link2,
    title: 'Link & domain analysis',
    description:
      'Drop in any link before you tap it. Custos checks domain age, redirect chains, certificate history, and known scam patterns — and tells you exactly which of those raised the flag.',
    points: [
      'Domain age and registration history lookup',
      'Full redirect chain tracing, not just the surface URL',
      'Certificate and hosting provider checks against known scam infrastructure',
    ],
    sample: {
      kind: 'Link',
      from: 'sharepoint-online.azurewebsites.net/s/auth?q=3f8d2a',
      body: 'Registered 6 days ago · hosted on a free app subdomain, not sharepoint.com · no organizational certificate',
      verdict: 'scam' as const,
      score: 93,
    },
  },
  {
    icon: Mail,
    title: 'Email & spoofing checks',
    description:
      'Full header-to-body analysis catches spoofed senders and business-email compromise, not just bad spelling. You get a highlighted breakdown of every suspicious element, not a black-box score.',
    points: [
      'SPF, DKIM, and DMARC header validation',
      'Display-name spoofing and lookalike domain detection',
      'Business email compromise pattern matching for invoice and wire fraud',
    ],
    sample: {
      kind: 'Email',
      from: 'no-reply@sharepoint-online.azurewebsites.net',
      body: '"Action Required: Q3_Financial_Review_Final.pdf has been shared with you. Expires 24 hours from receipt — open document to approve changes before EOD."',
      verdict: 'scam' as const,
      score: 95,
    },
  },
];

const MORE_FEATURES = [
  {
    icon: Fingerprint,
    title: 'Explained verdicts, not black boxes',
    description:
      'Every scan returns the specific signals that drove the score — which phrase, which domain flag, which header mismatch — so you can learn to spot the pattern yourself next time.',
  },
  {
    icon: History,
    title: 'Private scan history',
    description:
      'Signed-in users get an encrypted, searchable history of every scan. Revisit an old verdict, compare two similar messages, or delete anything permanently whenever you like.',
  },
  {
    icon: FileText,
    title: 'Downloadable reports',
    description:
      'Plus and Teams users can export any scan as a clean PDF report — useful for sharing with a bank, filing a complaint, or keeping records for your team.',
  },
  {
    icon: Zap,
    title: 'Fast enough to use every time',
    description:
      "Verdicts return in under two seconds on average. There's no reason to skip the check when it's this quick.",
  },
];

function VerdictCard({
  kind,
  from,
  body,
  verdict,
  score,
}: {
  kind: string;
  from: string;
  body: string;
  verdict: 'safe' | 'scam';
  score?: number;
}) {
  const isScam = verdict === 'scam';
  return (
    <div className="relative w-full max-w-sm mx-auto bg-white rounded-2xl border border-[#DEDACD] shadow-[0_20px_50px_-25px_rgba(20,24,26,0.35)] p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#8A8574]">{kind}</span>
        <span className="text-[10px] text-[#8A8574] font-mono truncate max-w-[55%]">{from}</span>
      </div>
      <p className="text-[13px] text-[#3A3A34] font-mono leading-relaxed border-t border-[#EAE6DB] pt-3">
        {body}
      </p>
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#EAE6DB]">
        <span
          className={`text-xs font-bold flex items-center gap-1.5 ${
            isScam ? 'text-[#D6483F]' : 'text-[#0E6E5C]'
          }`}
        >
          {isScam ? <ShieldAlert className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
          {isScam ? 'Scam detected' : 'Verified safe'}
        </span>
        {typeof score === 'number' && (
          <span className="text-[10px] text-[#8A8574] font-mono">Risk score: {score}%</span>
        )}
      </div>
    </div>
  );
}

export default function FeaturesPage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <main className="bg-[#F6F4EF] text-[#3A3A34]" style={{ fontFamily: 'var(--font-body)' }}>
      <Header />

      <section className="px-6 pt-16 pb-12 md:pt-24 md:pb-16">
        <div className="container mx-auto max-w-3xl text-center">
          <p className="text-[12px] font-bold uppercase tracking-widest text-[#0E6E5C] mb-3">
            Everything Custos does
          </p>
          <h1
            className="text-[36px] md:text-[48px] font-normal text-[#14181A] tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            One scanner. Every way a scam reaches you.
          </h1>
          <p className="mt-4 text-[16px] md:text-[18px] text-[#5C5A4E] leading-relaxed">
            Messages, links, and emails all get read the same careful way — and every verdict comes with the reasoning behind it, not just a score.
          </p>
        </div>
      </section>

      {/* Tabbed core feature explorer */}
      <section className="px-6 pb-16 md:pb-24 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="flex justify-center gap-2 mb-12 flex-wrap">
            {CORE_FEATURES.map((f, i) => (
              <button
                key={f.title}
                onClick={() => setActiveTab(i)}
                className={`px-5 py-2.5 rounded-full text-[13.5px] font-semibold transition-colors flex items-center gap-2 ${
                  activeTab === i
                    ? 'bg-[#14181A] text-white'
                    : 'bg-[#F6F4EF] text-[#5C5A4E] border border-[#DEDACD] hover:border-[#0E6E5C]/40'
                }`}
              >
                <f.icon className="w-3.5 h-3.5" />
                {f.title.split(' ').slice(0, 2).join(' ')}
              </button>
            ))}
          </div>

          {CORE_FEATURES.map((feature, i) => {
            if (i !== activeTab) return null;
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="flex flex-col md:flex-row gap-12 items-center">
                <div className="w-full md:w-1/2 space-y-5">
                  <div className="w-11 h-11 rounded-xl bg-[#EAE6DB] flex items-center justify-center">
                    <Icon className="w-5 h-5 text-[#0E6E5C]" />
                  </div>
                  <h2
                    className="text-[26px] font-normal text-[#14181A] tracking-tight"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {feature.title}
                  </h2>
                  <p className="text-[15.5px] text-[#5C5A4E] leading-relaxed max-w-md">
                    {feature.description}
                  </p>
                  <ul className="space-y-2.5 pt-2">
                    {feature.points.map((p) => (
                      <li key={p} className="flex items-start gap-2.5 text-[14px] text-[#3A3A34]">
                        <Check className="w-4 h-4 mt-0.5 shrink-0 text-[#0E6E5C]" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="w-full md:w-1/2">
                  <VerdictCard
                    kind={feature.sample.kind}
                    from={feature.sample.from}
                    body={feature.sample.body}
                    verdict={feature.sample.verdict}
                    score={feature.sample.score}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Additional platform features */}
      <section className="px-6 py-16 md:py-24">
        <div className="container mx-auto max-w-6xl">
          <div className="max-w-xl mb-14">
            <p className="text-[12px] font-bold uppercase tracking-widest text-[#0E6E5C] mb-3">
              Beyond the scan
            </p>
            <h2
              className="text-[30px] md:text-[36px] font-normal text-[#14181A] tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Built for people who scan more than once.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {MORE_FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="bg-white rounded-2xl border border-[#DEDACD] p-7 flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#EAE6DB] flex items-center justify-center shrink-0">
                    <Icon className="w-4.5 h-4.5 text-[#0E6E5C]" />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-semibold text-[#14181A]">{f.title}</h3>
                    <p className="mt-1.5 text-[14.5px] text-[#5C5A4E] leading-relaxed">{f.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}