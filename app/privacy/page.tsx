'use client';

import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const SECTIONS = [
  {
    title: '1. Information we collect',
    body: (
      <>
        <p>
          When you use Custos as a guest, we do not store the content you submit for scanning. Once
          the scan completes and you close the page, that content is discarded.
        </p>
        <p>
          When you create an account, we collect your email address, authentication details, and any
          scans you choose to save to your history. If you subscribe to a paid plan, our payment
          processor collects billing details on our behalf — we do not store full card numbers.
        </p>
      </>
    ),
  },
  {
    title: '2. How we use your information',
    body: (
      <>
        <p>We use the information we collect to:</p>
        <ul>
          <li>Provide the scanning service and return verdicts</li>
          <li>Maintain your account and saved scan history</li>
          <li>Process payments for paid plans</li>
          <li>Improve detection accuracy using aggregated, de-identified patterns</li>
          <li>Respond to support requests</li>
        </ul>
        <p>We do not sell your personal data or scan content to third parties.</p>
      </>
    ),
  },
  {
    title: '3. Data retention',
    body: (
      <>
        <p>
          Guest scans are never retained. Signed-in users' saved scans are stored in encrypted form
          until you delete them, or until you delete your account entirely.
        </p>
        <p>
          If you delete your account, your personal data and scan history are permanently removed
          within 30 days, except where we are required to retain limited billing records for legal or
          tax purposes.
        </p>
      </>
    ),
  },
  {
    title: '4. How we protect your data',
    body: (
      <p>
        Scan history and account data are encrypted at rest and in transit. Access to stored data is
        limited to systems and personnel that need it to operate the service, and Teams workspace
        admins can only see scans submitted within their own organization's workspace.
      </p>
    ),
  },
  {
    title: '5. Your rights',
    body: (
      <>
        <p>Depending on your location, you may have the right to:</p>
        <ul>
          <li>Access the personal data we hold about you</li>
          <li>Request correction or deletion of that data</li>
          <li>Export your scan history</li>
          <li>Object to certain uses of your data</li>
        </ul>
        <p>To exercise any of these rights, contact us at privacy@custos.ai.</p>
      </>
    ),
  },
  {
    title: '6. Changes to this policy',
    body: (
      <p>
        We may update this policy from time to time. If we make material changes, we will notify
        account holders by email or through an in-app notice before the changes take effect.
      </p>
    ),
  },
];

export default function PrivacyPage() {
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
            Privacy policy
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
            Questions about this policy? Email us at{' '}
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