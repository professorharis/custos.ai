'use client';

import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const SECTIONS = [
  {
    title: '1. Acceptance of terms',
    body: (
      <p>
        By accessing or using Custos, you agree to these terms. If you do not agree, please do not
        use the service. We may update these terms from time to time, and continued use after changes
        take effect constitutes acceptance of the updated terms.
      </p>
    ),
  },
  {
    title: '2. Description of the service',
    body: (
      <p>
        Custos analyzes text, links, and email content submitted by users and returns a risk
        assessment intended to help identify likely scams or phishing attempts. Verdicts are
        generated automatically and are provided for informational purposes only — they are not a
        guarantee that any content is safe or unsafe.
      </p>
    ),
  },
  {
    title: '3. Account responsibilities',
    body: (
      <>
        <p>
          You are responsible for maintaining the confidentiality of your account credentials and for
          all activity that occurs under your account. Notify us immediately if you suspect
          unauthorized access.
        </p>
        <p>You agree not to:</p>
        <ul>
          <li>Use the service to submit content that is illegal or violates the rights of others</li>
          <li>Attempt to reverse-engineer or interfere with the detection system</li>
          <li>Use automated means to exceed your plan's scan limits</li>
          <li>Resell or redistribute access to the service without a Teams agreement</li>
        </ul>
      </>
    ),
  },
  {
    title: '4. Subscriptions and billing',
    body: (
      <>
        <p>
          Paid plans are billed on a recurring basis (monthly for Plus, annually for Teams) until
          cancelled. You can cancel at any time from your account settings; access continues until the
          end of the period already paid for.
        </p>
        <p>
          We do not automatically issue refunds for partial billing periods, except where required by
          law.
        </p>
      </>
    ),
  },
  {
    title: '5. Disclaimer of warranties',
    body: (
      <p>
        Custos is provided "as is." While we work to keep detection accurate, no automated system is
        perfect, and we do not guarantee that every scam will be correctly identified or that every
        safe message will be marked safe. You should use your own judgment alongside any verdict
        Custos provides.
      </p>
    ),
  },
  {
    title: '6. Limitation of liability',
    body: (
      <p>
        To the maximum extent permitted by law, Custos and its team are not liable for any indirect,
        incidental, or consequential damages arising from your use of, or inability to use, the
        service, including any loss resulting from reliance on a scan verdict.
      </p>
    ),
  },
  {
    title: '7. Termination',
    body: (
      <p>
        We may suspend or terminate accounts that violate these terms. You may stop using the service
        and delete your account at any time from Account Settings.
      </p>
    ),
  },
  {
    title: '8. Governing law',
    body: (
      <p>
        These terms are governed by the laws of the jurisdiction in which Custos is registered to
        operate, without regard to conflict-of-law principles.
      </p>
    ),
  },
];

export default function TermsPage() {
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
            Terms & conditions
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
                <div className="space-y-3 text-[14.5px] text-[#3A3A34] leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5">
                  {s.body}
                </div>
              </div>
            ))}
          </div>

          <p className="mt-8 text-[13.5px] text-[#8A8574] text-center">
            Questions about these terms? Email us at{' '}
            <a href="mailto:legal@custos.ai" className="text-[#0E6E5C] underline underline-offset-2">
              legal@custos.ai
            </a>
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}