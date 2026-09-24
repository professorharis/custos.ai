'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ChevronDown } from 'lucide-react';

const FAQ_TABS: Record<string, { q: string; a: string }[]> = {
  General: [
    {
      q: 'What can I scan with Custos?',
      a: 'Any SMS, WhatsApp message, social media DM, email, or link. Paste the content in and Custos analyzes it the same way regardless of where it came from.',
    },
    {
      q: 'Do I need an account to try it?',
      a: 'No. Tap "Try Custos" and you land straight in the scanner as a guest, with a limited number of free scans per day. Sign up when you want unlimited scans and saved history.',
    },
    {
      q: 'How accurate is the detection?',
      a: 'Custos currently flags scam content with roughly 94% accuracy in our ongoing evaluation set. We show the reasoning behind every verdict so you can weigh it yourself rather than trust a black box.',
    },
    {
      q: 'How long does a scan take?',
      a: 'Most verdicts return in under two seconds. Longer or more complex email headers may take slightly longer to fully analyze.',
    },
  ],
  Pricing: [
    {
      q: 'Is the free plan actually free?',
      a: 'Yes — five scans a day, no card required, no trial that quietly starts billing you. Upgrade only when you need more.',
    },
    {
      q: 'Can I cancel Plus anytime?',
      a: 'Yes, from your account settings at any time. You keep access until the end of the billing period you already paid for.',
    },
    {
      q: 'Do Teams plans support single sign-on?',
      a: 'Yes. Teams includes SSO, audit logs, and dedicated onboarding for wiring Custos into your organization.',
    },
  ],
  Security: [
    {
      q: 'Do you store the messages I scan?',
      a: 'Guest scans are never stored. Signed-in scans are saved to your private history only, encrypted at rest, so you can revisit a report later — and you can delete any scan permanently at any time.',
    },
    {
      q: 'Could Custos itself be spoofed or phished?',
      a: "We publish our sending domains and never ask for your password inside a scan result. If something claiming to be Custos asks for credentials by email or DM, it isn't us — scan it and see.",
    },
    {
      q: 'What should I do if a verdict looks wrong?',
      a: 'Use the "Report this verdict" button on the result page. Our team reviews reported scans to keep detection accurate over time.',
    },
  ],
};

export default function FaqPage() {
  const [activeTab, setActiveTab] = useState<string>('General');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <main className="bg-[#F6F4EF] text-[#3A3A34]" style={{ fontFamily: 'var(--font-body)' }}>
      <Header />

      <section className="px-6 pt-16 pb-10 md:pt-24 md:pb-14">
        <div className="container mx-auto max-w-3xl text-center">
          <p className="text-[12px] font-bold uppercase tracking-widest text-[#0E6E5C] mb-3">FAQ</p>
          <h1
            className="text-[36px] md:text-[48px] font-normal text-[#14181A] tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Questions, answered plainly.
          </h1>
          <p className="mt-4 text-[16px] text-[#5C5A4E] leading-relaxed">
            Everything people ask us most, in one place. Still stuck? Our{' '}
            <a href="/support" className="text-[#0E6E5C] underline underline-offset-2">
              support page
            </a>{' '}
            has more ways to reach us.
          </p>
        </div>
      </section>

      <section className="px-6 pb-20 md:pb-28">
        <div className="container mx-auto max-w-3xl">
          <div className="flex justify-center gap-2 mb-10 flex-wrap">
            {Object.keys(FAQ_TABS).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setOpenFaq(0);
                }}
                className={`px-5 py-2.5 rounded-full text-[13.5px] font-semibold transition-colors ${
                  activeTab === tab
                    ? 'bg-[#14181A] text-white'
                    : 'bg-white text-[#5C5A4E] border border-[#DEDACD] hover:border-[#0E6E5C]/40'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="divide-y divide-[#DEDACD] border-t border-b border-[#DEDACD]">
            {FAQ_TABS[activeTab].map((faq, i) => (
              <div key={faq.q}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 py-5 text-left bg-transparent hover:bg-white/60 transition-colors"
                >
                  <span className="text-[15px] font-semibold text-[#14181A]">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 text-[#8A8574] transition-transform ${
                      openFaq === i ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <div className="pb-5 text-[14.5px] text-[#5C5A4E] leading-relaxed">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}