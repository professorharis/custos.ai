'use client';

import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Lock, Eye, Trash2, Users2, ShieldCheck, Scale } from 'lucide-react';

const COMMITMENTS = [
  {
    icon: Lock,
    title: 'Encryption by default',
    description: 'Saved scans and account data are encrypted both in transit and at rest.',
  },
  {
    icon: Eye,
    title: 'Explained, not opaque',
    description: 'Every verdict shows the specific signals behind it, so trust in the tool is earned through transparency.',
  },
  {
    icon: Trash2,
    title: 'Your data, your control',
    description: 'Delete any saved scan, or your entire account and history, permanently and at any time.',
  },
  {
    icon: Users2,
    title: 'No data resale',
    description: 'We never sell personal data or scan content to third parties, under any circumstance.',
  },
  {
    icon: ShieldCheck,
    title: 'We never ask for credentials',
    description: 'Custos never asks for your password or card details inside a scan result. If something claiming to be us does, it isn\'t us.',
  },
  {
    icon: Scale,
    title: 'Fair, reviewable verdicts',
    description: 'Every verdict can be reported and reviewed by our team if it looks wrong, so the system improves over time.',
  },
];

export default function TrustSafetyPage() {
  return (
    <main className="bg-[#F6F4EF] text-[#3A3A34]" style={{ fontFamily: 'var(--font-body)' }}>
      <Header />

      <section className="px-6 pt-16 pb-12 md:pt-24 md:pb-16">
        <div className="container mx-auto max-w-3xl text-center">
          <p className="text-[12px] font-bold uppercase tracking-widest text-[#0E6E5C] mb-3">
            Trust & safety
          </p>
          <h1
            className="text-[36px] md:text-[48px] font-normal text-[#14181A] tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            A tool built to be trusted, not just used.
          </h1>
          <p className="mt-4 text-[16px] md:text-[18px] text-[#5C5A4E] leading-relaxed">
            We ask people to trust us with sensitive, sometimes worrying content. Here's exactly how we
            handle that responsibility.
          </p>
        </div>
      </section>

      {/* Commitments grid */}
      <section className="px-6 pb-16 md:pb-24 bg-white">
        <div className="container mx-auto max-w-6xl grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {COMMITMENTS.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.title} className="rounded-2xl border border-[#DEDACD] p-7 bg-[#F6F4EF]">
                <div className="w-10 h-10 rounded-xl bg-white border border-[#DEDACD] flex items-center justify-center mb-4">
                  <Icon className="w-4.5 h-4.5 text-[#0E6E5C]" />
                </div>
                <h3 className="text-[15.5px] font-semibold text-[#14181A]">{c.title}</h3>
                <p className="mt-2 text-[13.5px] text-[#5C5A4E] leading-relaxed">{c.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How we handle content */}
      <section className="px-6 py-16 md:py-24">
        <div className="container mx-auto max-w-3xl">
          <div className="bg-white rounded-2xl border border-[#DEDACD] p-8 md:p-12 space-y-8">
            <div>
              <h2 className="text-[19px] font-semibold text-[#14181A] mb-3">
                How we handle what you submit
              </h2>
              <p className="text-[14.5px] text-[#3A3A34] leading-relaxed">
                Content submitted as a guest is analyzed in memory and never written to storage — once
                you close the page, it's gone. Signed-in users can choose to save scans to their private
                history, which is encrypted and visible only to them.
              </p>
            </div>
            <div>
              <h2 className="text-[19px] font-semibold text-[#14181A] mb-3">
                Reporting something that concerns you
              </h2>
              <p className="text-[14.5px] text-[#3A3A34] leading-relaxed">
                If you come across a scam pattern you think we should know about, use the{' '}
                <a href="/report-scam" className="text-[#0E6E5C] underline underline-offset-2">
                  Report a Scam
                </a>{' '}
                form. If you have a concern about how Custos itself is handling your data, contact us
                directly at{' '}
                <a href="mailto:trust@custos.ai" className="text-[#0E6E5C] underline underline-offset-2">
                  trust@custos.ai
                </a>
                .
              </p>
            </div>
            <div>
              <h2 className="text-[19px] font-semibold text-[#14181A] mb-3">Related policies</h2>
              <p className="text-[14.5px] text-[#3A3A34] leading-relaxed">
                For the full legal detail behind these commitments, see our{' '}
                <a href="/privacy" className="text-[#0E6E5C] underline underline-offset-2">
                  Privacy policy
                </a>
                ,{' '}
                <a href="/terms" className="text-[#0E6E5C] underline underline-offset-2">
                  Terms & conditions
                </a>
                , and{' '}
                <a href="/compliance" className="text-[#0E6E5C] underline underline-offset-2">
                  Compliance
                </a>{' '}
                pages.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}