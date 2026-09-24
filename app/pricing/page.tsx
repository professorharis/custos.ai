'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Check, Minus, ArrowUpRight, ChevronDown } from 'lucide-react';

const PRICING = [
  {
    name: 'Free',
    tagline: 'For anyone, no account needed',
    price: '$0',
    period: 'forever',
    cta: 'Try as a guest',
    highlighted: false,
    features: [
      '5 scans per day',
      'Message, link & email scanning',
      'Plain-English risk score',
      'Community support',
    ],
  },
  {
    name: 'Plus',
    tagline: 'For people who scan often',
    price: '$9.99',
    period: 'per month',
    cta: 'Get Plus',
    highlighted: true,
    features: [
      'Unlimited scans',
      'Downloadable PDF reports',
      'Full follow-up chat on every scan',
      'Priority detection model',
      'Scan history that syncs everywhere',
    ],
  },
  {
    name: 'Teams',
    tagline: 'For organizations & security teams',
    price: 'Custom',
    period: 'billed annually',
    cta: 'Talk to sales',
    highlighted: false,
    features: [
      'Everything in Plus',
      'Shared team workspace',
      'Admin controls & permissions',
      'SSO & audit logs',
      'Dedicated onboarding',
    ],
  },
];

const COMPARE_ROWS: { label: string; free: boolean | string; plus: boolean | string; teams: boolean | string }[] = [
  { label: 'Daily scans', free: '5 / day', plus: 'Unlimited', teams: 'Unlimited' },
  { label: 'Message, link & email scanning', free: true, plus: true, teams: true },
  { label: 'Plain-English risk score', free: true, plus: true, teams: true },
  { label: 'Explained verdict breakdown', free: true, plus: true, teams: true },
  { label: 'Synced scan history', free: false, plus: true, teams: true },
  { label: 'Downloadable PDF reports', free: false, plus: true, teams: true },
  { label: 'Priority detection model', free: false, plus: true, teams: true },
  { label: 'Shared team workspace', free: false, plus: false, teams: true },
  { label: 'Admin controls & permissions', free: false, plus: false, teams: true },
  { label: 'SSO & audit logs', free: false, plus: false, teams: true },
  { label: 'Dedicated onboarding', free: false, plus: false, teams: true },
];

const PRICING_FAQ = [
  {
    q: 'Is the free plan actually free?',
    a: 'Yes — five scans a day, no card required, no trial that quietly starts billing you. Upgrade only when you need more.',
  },
  {
    q: 'Can I cancel Plus anytime?',
    a: 'Yes, from your account settings at any time. You keep access until the end of the billing period you already paid for.',
  },
  {
    q: 'What happens if I go over 5 scans on the Free plan?',
    a: "You'll be prompted to upgrade to Plus, or you can simply wait until your daily limit resets the next day.",
  },
  {
    q: 'How is Teams pricing calculated?',
    a: 'Teams is billed annually based on the number of seats and scan volume your organization needs. Talk to sales for a quote tailored to your team size.',
  },
  {
    q: 'Do you offer discounts for nonprofits or students?',
    a: 'Yes, reach out to our support team with proof of status and we will apply a discount to your Plus subscription.',
  },
];

function CompareCell({ value }: { value: boolean | string }) {
  if (typeof value === 'string') {
    return <span className="text-[13.5px] font-medium text-[#14181A]">{value}</span>;
  }
  return value ? (
    <Check className="w-4 h-4 text-[#0E6E5C] mx-auto" />
  ) : (
    <Minus className="w-4 h-4 text-[#C9C5B7] mx-auto" />
  );
}

export default function PricingPage() {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <main className="bg-[#F6F4EF] text-[#3A3A34]" style={{ fontFamily: 'var(--font-body)' }}>
      <Header />

      <section className="px-6 pt-16 pb-10 md:pt-24 md:pb-14">
        <div className="container mx-auto max-w-3xl text-center">
          <p className="text-[12px] font-bold uppercase tracking-widest text-[#0E6E5C] mb-3">Pricing</p>
          <h1
            className="text-[36px] md:text-[48px] font-normal text-[#14181A] tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Start free. Upgrade when you need more.
          </h1>
          <p className="mt-4 text-[16px] text-[#5C5A4E] leading-relaxed">
            No hidden fees, no forced trials. Pick the plan that matches how often you check things.
          </p>
        </div>
      </section>

      <section className="px-6 pb-16 md:pb-24">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8 items-start">
            {PRICING.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-8 flex flex-col h-full ${
                  plan.highlighted
                    ? 'bg-[#14181A] text-[#F6F4EF] shadow-xl md:-translate-y-3'
                    : 'bg-white border border-[#DEDACD] text-[#3A3A34]'
                }`}
              >
                <h2
                  className={`text-[20px] font-normal tracking-tight ${plan.highlighted ? 'text-white' : 'text-[#14181A]'}`}
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {plan.name}
                </h2>
                <p className={`text-[13.5px] mt-1 ${plan.highlighted ? 'text-[#B9B7AC]' : 'text-[#8A8574]'}`}>
                  {plan.tagline}
                </p>
                <div className="mt-6 flex items-baseline gap-2">
                  <span
                    className={`text-[36px] font-normal ${plan.highlighted ? 'text-white' : 'text-[#14181A]'}`}
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {plan.price}
                  </span>
                  <span className={`text-[13px] ${plan.highlighted ? 'text-[#B9B7AC]' : 'text-[#8A8574]'}`}>
                    {plan.period}
                  </span>
                </div>

                <ul className="mt-7 space-y-3 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[14px]">
                      <Check
                        className={`w-4 h-4 mt-0.5 shrink-0 ${
                          plan.highlighted ? 'text-[#4FCBA9]' : 'text-[#0E6E5C]'
                        }`}
                      />
                      <span className={plan.highlighted ? 'text-[#DCDAD0]' : 'text-[#5C5A4E]'}>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => router.push(plan.name === 'Free' ? '/scanner' : '/?signup=1')}
                  className={`mt-8 w-full inline-flex items-center justify-center gap-2 font-semibold text-[14px] px-6 py-3 rounded-full transition-colors ${
                    plan.highlighted
                      ? 'bg-[#F6F4EF] text-[#14181A] hover:bg-white'
                      : 'bg-[#14181A] text-[#F6F4EF] hover:bg-[#0E6E5C]'
                  }`}
                >
                  {plan.cta}
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed comparison table */}
      <section className="px-6 py-16 md:py-24 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center max-w-xl mx-auto mb-12">
            <p className="text-[12px] font-bold uppercase tracking-widest text-[#0E6E5C] mb-3">
              Compare plans
            </p>
            <h2
              className="text-[28px] md:text-[34px] font-normal text-[#14181A] tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Every feature, side by side.
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[520px]">
              <thead>
                <tr className="border-b border-[#DEDACD]">
                  <th className="py-4 pr-4 text-[13px] font-semibold text-[#8A8574] uppercase tracking-wide">
                    Feature
                  </th>
                  <th className="py-4 px-4 text-[13px] font-semibold text-[#14181A] text-center">Free</th>
                  <th className="py-4 px-4 text-[13px] font-semibold text-[#0E6E5C] text-center">Plus</th>
                  <th className="py-4 px-4 text-[13px] font-semibold text-[#14181A] text-center">Teams</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((row) => (
                  <tr key={row.label} className="border-b border-[#EAE6DB]">
                    <td className="py-4 pr-4 text-[14px] text-[#3A3A34]">{row.label}</td>
                    <td className="py-4 px-4 text-center">
                      <CompareCell value={row.free} />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <CompareCell value={row.plus} />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <CompareCell value={row.teams} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Pricing-specific FAQ */}
      <section className="px-6 py-16 md:py-24">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <p className="text-[12px] font-bold uppercase tracking-widest text-[#0E6E5C] mb-3">
              Billing questions
            </p>
            <h2
              className="text-[28px] md:text-[34px] font-normal text-[#14181A] tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              About your plan.
            </h2>
          </div>

          <div className="divide-y divide-[#DEDACD] border-t border-b border-[#DEDACD]">
            {PRICING_FAQ.map((faq, i) => (
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