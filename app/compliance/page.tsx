'use client';

import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ShieldCheck, Lock, FileCheck, Globe } from 'lucide-react';

const PILLARS = [
  {
    icon: Lock,
    title: 'Data encryption',
    description: 'All scan history and account data is encrypted in transit and at rest.',
  },
  {
    icon: FileCheck,
    title: 'Data minimization',
    description: 'Guest scans are never stored, and saved scans can be permanently deleted at any time.',
  },
  {
    icon: Globe,
    title: 'Regional data handling',
    description: 'We follow applicable regional data protection requirements for the markets we serve.',
  },
  {
    icon: ShieldCheck,
    title: 'Access controls',
    description: 'Internal access to stored data is limited to systems and personnel who need it to operate the service.',
  },
];

const SECTIONS = [
  {
    title: '1. Our compliance approach',
    body: (
      <p>
        Custos handles sensitive content — messages, emails, and links people are worried might be
        scams — so we treat data protection as a core part of the product, not an afterthought. Our
        approach is built around minimizing what we store, encrypting what we do store, and giving
        users full control to delete their data.
      </p>
    ),
  },
  {
    title: '2. Data protection regulations',
    body: (
      <p>
        We design our data handling practices with regard to applicable data protection laws in the
        regions we operate, including principles around lawful processing, data minimization, and the
        right to access, correct, or delete personal data. Specific regional certifications and
        registrations will be published here as they are completed.
      </p>
    ),
  },
  {
    title: '3. Teams & organizational compliance',
    body: (
      <p>
        Teams plan customers can request audit logs of workspace activity and admin-level controls
        over member access. If your organization has specific compliance requirements — such as data
        residency or contractual data processing terms — contact our sales team to discuss a Teams
        agreement.
      </p>
    ),
  },
  {
    title: '4. Reporting a compliance concern',
    body: (
      <p>
        If you believe Custos is not meeting a stated compliance commitment, or you have a question
        about how your data is handled, contact us directly at compliance@custos.ai and we will
        investigate promptly.
      </p>
    ),
  },
];

export default function CompliancePage() {
  return (
    <main className="bg-[#F6F4EF] text-[#3A3A34]" style={{ fontFamily: 'var(--font-body)' }}>
      <Header />

      <section className="px-6 pt-16 pb-10 md:pt-24 md:pb-14">
        <div className="container mx-auto max-w-3xl">
          <p className="text-[12px] font-bold uppercase tracking-widest text-[#0E6E5C] mb-3">Legal</p>
          <h1
            className="text-[32px] md:text-[42px] font-normal text-[#14181A] tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Compliance
          </h1>
          <p className="mt-3 text-[14px] text-[#8A8574]">Last updated: July 1, 2026</p>
        </div>
      </section>

      {/* Pillars */}
      <section className="px-6 pb-16 bg-white">
        <div className="container mx-auto max-w-4xl grid sm:grid-cols-2 gap-6">
          {PILLARS.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.title} className="rounded-2xl border border-[#DEDACD] p-6 bg-[#F6F4EF]">
                <div className="w-10 h-10 rounded-xl bg-white border border-[#DEDACD] flex items-center justify-center mb-3">
                  <Icon className="w-4.5 h-4.5 text-[#0E6E5C]" />
                </div>
                <h3 className="text-[15px] font-semibold text-[#14181A]">{p.title}</h3>
                <p className="mt-1.5 text-[13.5px] text-[#5C5A4E] leading-relaxed">{p.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="px-6 pb-20 md:pb-28 pt-4">
        <div className="container mx-auto max-w-3xl">
          <div className="bg-white rounded-2xl border border-[#DEDACD] p-8 md:p-12 space-y-10">
            {SECTIONS.map((s) => (
              <div key={s.title}>
                <h2 className="text-[19px] font-semibold text-[#14181A] mb-3">{s.title}</h2>
                <div className="space-y-3 text-[14.5px] text-[#3A3A34] leading-relaxed">{s.body}</div>
              </div>
            ))}
          </div>

          <p className="mt-8 text-[13.5px] text-[#8A8574] text-center">
            Questions about compliance? Email us at{' '}
            <a href="mailto:compliance@custos.ai" className="text-[#0E6E5C] underline underline-offset-2">
              compliance@custos.ai
            </a>
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}