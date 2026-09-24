'use client';

import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import {
  CreditCard,
  Smartphone,
  Landmark,
  Package,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

const SCAM_CATEGORIES = [
  {
    icon: Landmark,
    title: 'Bank & finance impersonation',
    description:
      'Fake alerts about blocked cards, suspicious logins, or frozen accounts that push you to "verify" details on a lookalike site.',
    tip: 'Banks never ask you to verify your full card number or password by text or email link.',
  },
  {
    icon: Package,
    title: 'Courier & delivery scams',
    description:
      'Texts claiming a package is held for a small "customs" or "redelivery" fee, linking to a fake payment page.',
    tip: "Legitimate couriers don't charge redelivery fees through a text link — check tracking directly on the courier's real site.",
  },
  {
    icon: Smartphone,
    title: 'Prize & giveaway scams',
    description:
      'Messages claiming you\'ve won a lottery, phone, or gift card, asking you to click a link or pay a "processing fee" to claim it.',
    tip: "If you didn't enter a contest, you can't have won it.",
  },
  {
    icon: CreditCard,
    title: 'Invoice & business email compromise',
    description:
      'Spoofed vendor or colleague emails asking to approve an invoice, change a payment account, or urgently wire funds.',
    tip: 'Always confirm payment changes with the vendor through a separate, known channel before acting.',
  },
];

const STEPS = [
  {
    step: '01',
    title: 'Paste it into Custos',
    description: 'Copy the suspicious message, link, or email into the scanner before you click or reply.',
  },
  {
    step: '02',
    title: 'Read the verdict and reasoning',
    description: 'See whether it looks safe or risky, and exactly which signals contributed to that verdict.',
  },
  {
    step: '03',
    title: 'Act with confidence',
    description: 'If it\'s flagged as a scam, don\'t click, reply, or share any information — and report it if you can.',
  },
];

export default function FraudProtectionPage() {
  return (
    <main className="bg-[#F6F4EF] text-[#3A3A34]" style={{ fontFamily: 'var(--font-body)' }}>
      <Header />

      <section className="px-6 pt-16 pb-12 md:pt-24 md:pb-16">
        <div className="container mx-auto max-w-3xl text-center">
          <p className="text-[12px] font-bold uppercase tracking-widest text-[#0E6E5C] mb-3">
            Fraud protection
          </p>
          <h1
            className="text-[36px] md:text-[48px] font-normal text-[#14181A] tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Know the tactics before they reach you.
          </h1>
          <p className="mt-4 text-[16px] md:text-[18px] text-[#5C5A4E] leading-relaxed">
            Most scams follow a handful of recognizable patterns. Here's what to watch for, and how
            Custos helps you check before you act.
          </p>
        </div>
      </section>

      {/* Common scam categories */}
      <section className="px-6 pb-16 md:pb-24 bg-white">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-2 gap-6">
            {SCAM_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <div key={cat.title} className="rounded-2xl border border-[#DEDACD] p-7 bg-[#F6F4EF]">
                  <div className="w-10 h-10 rounded-xl bg-white border border-[#DEDACD] flex items-center justify-center mb-4">
                    <Icon className="w-4.5 h-4.5 text-[#0E6E5C]" />
                  </div>
                  <h3 className="text-[16px] font-semibold text-[#14181A]">{cat.title}</h3>
                  <p className="mt-2 text-[14px] text-[#5C5A4E] leading-relaxed">{cat.description}</p>
                  <div className="mt-4 flex items-start gap-2 pt-3 border-t border-[#DEDACD]">
                    <ShieldAlert className="w-3.5 h-3.5 text-[#D6483F] mt-0.5 shrink-0" />
                    <p className="text-[13px] text-[#5C5A4E] leading-relaxed">{cat.tip}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How Custos helps - steps */}
      <section className="px-6 py-16 md:py-24">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center max-w-xl mx-auto mb-14">
            <p className="text-[12px] font-bold uppercase tracking-widest text-[#0E6E5C] mb-3">
              Your three-step check
            </p>
            <h2
              className="text-[28px] md:text-[34px] font-normal text-[#14181A] tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              A habit that takes ten seconds.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((s) => (
              <div key={s.step}>
                <span
                  className="text-[36px] font-normal text-[#0E6E5C]/30"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {s.step}
                </span>
                <h3 className="text-[16px] font-semibold text-[#14181A] mt-2">{s.title}</h3>
                <p className="mt-1.5 text-[14px] text-[#5C5A4E] leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-16 md:pb-24">
        <div className="container mx-auto max-w-6xl">
          <div className="bg-[#14181A] rounded-3xl px-10 py-14 md:px-16 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
            <div>
              <h2
                className="text-[26px] md:text-[32px] font-normal text-white tracking-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Got something suspicious right now?
              </h2>
              <p className="mt-3 text-[15px] text-[#B9B7AC] max-w-md">
                Paste it into the scanner and get a verdict in seconds — no account required.
              </p>
            </div>
            <a
              href="/scanner"
              className="inline-flex items-center gap-2 bg-[#F6F4EF] hover:bg-white text-[#14181A] font-semibold px-7 py-3.5 rounded-full transition-colors shrink-0"
            >
              Scan it now
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}