'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ChevronDown, Mail, MessageCircle, Clock, CheckCircle2 } from 'lucide-react';

const CONTACT_CHANNELS = [
  {
    icon: Mail,
    title: 'Email support',
    description: 'For account issues, billing questions, or anything that needs a paper trail.',
    action: 'support@custos.ai',
    href: 'mailto:support@custos.ai',
  },
  {
    icon: MessageCircle,
    title: 'Live chat',
    description: 'Available for Plus and Teams users directly from your dashboard, Monday to Saturday.',
    action: 'Open chat in app',
    href: '/scanner',
  },
  {
    icon: Clock,
    title: 'Response times',
    description: 'Free plan: within 2 business days. Plus: within 1 business day. Teams: dedicated response SLA.',
    action: null,
    href: null,
  },
];

const FAQ_TABS: Record<string, { q: string; a: string }[]> = {
  'Getting started': [
    {
      q: 'What can I scan with Custos?',
      a: 'Any SMS, WhatsApp message, social media DM, email, or link. Paste the content in and Custos analyzes it the same way regardless of where it came from.',
    },
    {
      q: 'Do I need an account to try it?',
      a: 'No. Tap "Try Custos" and you land straight in the scanner as a guest, with a limited number of free scans per day. Sign up when you want unlimited scans and saved history.',
    },
    {
      q: 'How long does a scan take?',
      a: 'Most verdicts return in under two seconds. Longer or more complex email headers may take slightly longer to fully analyze.',
    },
    {
      q: 'Can I scan something on behalf of someone else, like a parent?',
      a: 'Yes, many people paste in messages forwarded from family members. The scan works the same regardless of who received the original message.',
    },
  ],
  Account: [
    {
      q: 'How do I upgrade or downgrade my plan?',
      a: 'Go to Account Settings > Billing. Changes to a higher plan apply immediately; downgrades take effect at the end of your current billing period.',
    },
    {
      q: 'I forgot my password, what do I do?',
      a: 'Use the "Forgot password" link on the sign-in page, or sign in with Google if that is how you originally created your account.',
    },
    {
      q: 'Can I have multiple people on one account?',
      a: 'Individual accounts are for one person. If you need shared access for a team, the Teams plan includes a shared workspace with multiple seats.',
    },
    {
      q: 'How do I delete my account?',
      a: 'From Account Settings > Privacy, choose "Delete account." This permanently removes your scan history and personal data within 30 days.',
    },
  ],
  Troubleshooting: [
    {
      q: "A scan result seems wrong. What should I do?",
      a: 'Every verdict shows the reasoning behind it. If something still looks off, use the "Report this verdict" button on the result page so our team can review it.',
    },
    {
      q: 'The scanner is not loading or is stuck.',
      a: 'Try refreshing the page first. If the issue continues, check our status page for any ongoing incidents, or contact support with a screenshot.',
    },
    {
      q: 'I was charged but my plan still shows Free.',
      a: 'This is usually a brief sync delay after payment. If your plan has not updated within 15 minutes, contact support with your receipt and we will fix it right away.',
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
      q: 'Who can see my scan history?',
      a: 'Only you. On Teams plans, workspace admins can see scans submitted through the shared workspace, but personal account scans stay private.',
    },
  ],
};

export default function SupportPage() {
  const [activeFaqTab, setActiveFaqTab] = useState<string>('Getting started');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <main className="bg-[#F6F4EF] text-[#3A3A34]" style={{ fontFamily: 'var(--font-body)' }}>
      <Header />

      <section className="px-6 pt-16 pb-10 md:pt-24 md:pb-14">
        <div className="container mx-auto max-w-3xl text-center">
          <p className="text-[12px] font-bold uppercase tracking-widest text-[#0E6E5C] mb-3">Support</p>
          <h1
            className="text-[36px] md:text-[48px] font-normal text-[#14181A] tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            We're here if something looks off.
          </h1>
          <p className="mt-4 text-[16px] text-[#5C5A4E] leading-relaxed">
            Browse answers below, or reach a real person through any of the channels underneath.
          </p>
        </div>
      </section>

      {/* Contact channels */}
      <section className="px-6 pb-16 md:pb-20 bg-white">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-3 gap-6">
            {CONTACT_CHANNELS.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.title} className="rounded-2xl border border-[#DEDACD] p-7 bg-[#F6F4EF]">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center mb-4 border border-[#DEDACD]">
                    <Icon className="w-4.5 h-4.5 text-[#0E6E5C]" />
                  </div>
                  <h3 className="text-[16px] font-semibold text-[#14181A]">{c.title}</h3>
                  <p className="mt-2 text-[14px] text-[#5C5A4E] leading-relaxed">{c.description}</p>
                  {c.action && c.href && (
                    <a
                      href={c.href}
                      className="mt-4 inline-block text-[13.5px] font-semibold text-[#0E6E5C] underline underline-offset-2"
                    >
                      {c.action}
                    </a>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-[13.5px] text-[#5C5A4E]">
            <CheckCircle2 className="w-4 h-4 text-[#0E6E5C]" />
            All systems operational —{' '}
            <a href="#" className="underline underline-offset-2 hover:text-[#0E6E5C]">
              view status page
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-16 md:py-24">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <p className="text-[12px] font-bold uppercase tracking-widest text-[#0E6E5C] mb-3">FAQ</p>
            <h2
              className="text-[28px] md:text-[34px] font-normal text-[#14181A] tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Questions, answered plainly.
            </h2>
          </div>

          <div className="flex justify-center gap-2 mb-10 flex-wrap">
            {Object.keys(FAQ_TABS).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveFaqTab(tab);
                  setOpenFaq(0);
                }}
                className={`px-5 py-2.5 rounded-full text-[13.5px] font-semibold transition-colors ${
                  activeFaqTab === tab
                    ? 'bg-[#14181A] text-white'
                    : 'bg-white text-[#5C5A4E] border border-[#DEDACD] hover:border-[#0E6E5C]/40'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="divide-y divide-[#DEDACD] border-t border-b border-[#DEDACD]">
            {FAQ_TABS[activeFaqTab].map((faq, i) => (
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

          <div className="mt-16 bg-white rounded-2xl border border-[#DEDACD] p-8 text-center">
            <Mail className="w-6 h-6 text-[#0E6E5C] mx-auto mb-3" />
            <h2
              className="text-[20px] font-normal text-[#14181A] tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Still stuck?
            </h2>
            <p className="mt-2 text-[14.5px] text-[#5C5A4E]">
              Email us at{' '}
              <a href="mailto:support@custos.ai" className="text-[#0E6E5C] underline underline-offset-2">
                support@custos.ai
              </a>{' '}
              and we'll reply within one business day.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}