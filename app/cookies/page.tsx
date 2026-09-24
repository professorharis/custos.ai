'use client';

import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Check, Minus } from 'lucide-react';

const COOKIE_TABLE = [
  {
    name: 'Session & authentication',
    purpose: 'Keeps you signed in and secures your account session.',
    required: true,
  },
  {
    name: 'Preferences',
    purpose: 'Remembers settings like your plan view and dashboard layout.',
    required: false,
  },
  {
    name: 'Analytics',
    purpose: 'Helps us understand which pages and features are used most, in aggregate.',
    required: false,
  },
];

const SECTIONS = [
  {
    title: '1. What are cookies',
    body: (
      <p>
        Cookies are small text files stored on your device that let a website remember information
        between visits, such as whether you're signed in or which preferences you've set.
      </p>
    ),
  },
  {
    title: '2. Cookies we use',
    body: (
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[480px]">
          <thead>
            <tr className="border-b border-[#DEDACD]">
              <th className="py-3 pr-4 text-[13px] font-semibold text-[#8A8574] uppercase tracking-wide">
                Type
              </th>
              <th className="py-3 pr-4 text-[13px] font-semibold text-[#8A8574] uppercase tracking-wide">
                Purpose
              </th>
              <th className="py-3 text-[13px] font-semibold text-[#8A8574] uppercase tracking-wide text-center">
                Required
              </th>
            </tr>
          </thead>
          <tbody>
            {COOKIE_TABLE.map((row) => (
              <tr key={row.name} className="border-b border-[#EAE6DB]">
                <td className="py-3 pr-4 text-[14px] font-medium text-[#14181A]">{row.name}</td>
                <td className="py-3 pr-4 text-[14px] text-[#5C5A4E]">{row.purpose}</td>
                <td className="py-3 text-center">
                  {row.required ? (
                    <Check className="w-4 h-4 text-[#0E6E5C] mx-auto" />
                  ) : (
                    <Minus className="w-4 h-4 text-[#C9C5B7] mx-auto" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
  },
  {
    title: '3. Managing your preferences',
    body: (
      <p>
        Required cookies cannot be turned off, as the service will not function correctly without
        them. You can disable preference and analytics cookies at any time from your browser settings,
        or from the cookie preferences link in your account settings if you're signed in.
      </p>
    ),
  },
  {
    title: '4. Third-party cookies',
    body: (
      <p>
        We use a small number of trusted third parties for payment processing and authentication
        (such as Google Sign-In). These providers may set their own cookies subject to their own
        privacy policies, which we encourage you to review.
      </p>
    ),
  },
  {
    title: '5. Changes to this policy',
    body: (
      <p>
        We may update this cookie policy occasionally to reflect changes in the cookies we use. Any
        material changes will be reflected in the "last updated" date at the top of this page.
      </p>
    ),
  },
];

export default function CookiesPage() {
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
            Cookie policy
          </h1>
          <p className="mt-3 text-[14px] text-[#8A8574]">Last updated: July 1, 2026</p>
        </div>
      </section>

      <section className="px-6 pb-20 md:pb-28">
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
            Questions about cookies? Email us at{' '}
            <a href="mailto:privacy@custos.ai" className="text-[#0E6E5C] underline underline-offset-2">
              privacy@custos.ai
            </a>
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}