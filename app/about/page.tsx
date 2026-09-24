'use client';

import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ShieldCheck, Target, Users, Sparkles, ArrowRight } from 'lucide-react';

const VALUES = [
  {
    icon: ShieldCheck,
    title: 'Verify, don\'t assume',
    description:
      'Trust should be earned by evidence, not by a convincing tone. Every verdict we give is backed by specific, checkable signals.',
  },
  {
    icon: Target,
    title: 'Explain the reasoning',
    description:
      'A score with no explanation is just another thing to trust blindly. We show our work on every single scan.',
  },
  {
    icon: Users,
    title: 'Built for everyone',
    description:
      'From someone forwarding a suspicious text from a parent to a security team screening vendor emails — the tool should work the same for all of them.',
  },
];

const TIMELINE = [
  { year: '2024', text: 'Custos started as a small side project to catch courier and bank impersonation scams circulating in group chats.' },
  { year: '2025', text: 'Expanded detection to full email header analysis and link redirect tracing, and opened the scanner to the public.' },
  { year: '2026', text: 'Introduced scan history, PDF reports, and the Teams plan for organizations screening messages at scale.' },
];

export default function AboutPage() {
  return (
    <main className="bg-[#F6F4EF] text-[#3A3A34]" style={{ fontFamily: 'var(--font-body)' }}>
      <Header />

      <section className="px-6 pt-16 pb-12 md:pt-24 md:pb-16">
        <div className="container mx-auto max-w-3xl text-center">
          <p className="text-[12px] font-bold uppercase tracking-widest text-[#0E6E5C] mb-3">About us</p>
          <h1
            className="text-[36px] md:text-[48px] font-normal text-[#14181A] tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            We built the tool we wished our families had.
          </h1>
          <p className="mt-4 text-[16px] md:text-[18px] text-[#5C5A4E] leading-relaxed">
            Custos exists because scams keep getting more convincing, and most people are left to trust
            their gut against messages engineered to fool exactly that instinct.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="px-6 pb-16 md:pb-24 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-[#F6F4EF] rounded-2xl border border-[#DEDACD] p-8 md:p-12 text-center">
            <Sparkles className="w-6 h-6 text-[#0E6E5C] mx-auto mb-4" />
            <h2
              className="text-[24px] md:text-[28px] font-normal text-[#14181A] tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Our mission
            </h2>
            <p className="mt-4 text-[15.5px] text-[#5C5A4E] leading-relaxed max-w-2xl mx-auto">
              Give anyone — regardless of technical background — a fast, honest second opinion before
              they click a link, reply to a text, or trust an email. Not a black-box score, but a clear
              explanation they can actually learn from.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="px-6 py-16 md:py-24">
        <div className="container mx-auto max-w-6xl">
          <div className="max-w-xl mb-14">
            <p className="text-[12px] font-bold uppercase tracking-widest text-[#0E6E5C] mb-3">
              What we believe
            </p>
            <h2
              className="text-[30px] md:text-[36px] font-normal text-[#14181A] tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              The principles behind every scan.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {VALUES.map((v) => {
              const Icon = v.icon;
              return (
                <div key={v.title} className="bg-white rounded-2xl border border-[#DEDACD] p-7">
                  <div className="w-10 h-10 rounded-xl bg-[#EAE6DB] flex items-center justify-center mb-4">
                    <Icon className="w-4.5 h-4.5 text-[#0E6E5C]" />
                  </div>
                  <h3 className="text-[16px] font-semibold text-[#14181A]">{v.title}</h3>
                  <p className="mt-2 text-[14.5px] text-[#5C5A4E] leading-relaxed">{v.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="px-6 py-16 md:py-24 bg-white">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center max-w-xl mx-auto mb-14">
            <p className="text-[12px] font-bold uppercase tracking-widest text-[#0E6E5C] mb-3">
              Our story
            </p>
            <h2
              className="text-[28px] md:text-[34px] font-normal text-[#14181A] tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              How we got here.
            </h2>
          </div>

          <div className="space-y-8">
            {TIMELINE.map((item) => (
              <div key={item.year} className="flex gap-6">
                <div className="shrink-0 w-16 text-[18px] font-semibold text-[#0E6E5C]">
                  {item.year}
                </div>
                <div className="pb-8 border-l border-[#DEDACD] pl-6 -ml-px">
                  <p className="text-[15px] text-[#3A3A34] leading-relaxed">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16 md:py-24">
        <div className="container mx-auto max-w-6xl">
          <div className="bg-[#14181A] rounded-3xl px-10 py-14 md:px-16 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
            <div>
              <h2
                className="text-[26px] md:text-[32px] font-normal text-white tracking-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                See it for yourself.
              </h2>
              <p className="mt-3 text-[15px] text-[#B9B7AC] max-w-md">
                Paste your first message and get a verdict in seconds — no account required.
              </p>
            </div>
            <a
              href="/scanner"
              className="inline-flex items-center gap-2 bg-[#F6F4EF] hover:bg-white text-[#14181A] font-semibold px-7 py-3.5 rounded-full transition-colors shrink-0"
            >
              Try Custos free
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}