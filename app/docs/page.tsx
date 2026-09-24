'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import {
  BookOpen,
  ShieldCheck,
  MessageSquareWarning,
  Link2,
  Mail,
  History,
  FileText,
  UserCog,
  ChevronRight,
} from 'lucide-react';

const NAV_SECTIONS = [
  {
    id: 'getting-started',
    label: 'Getting started',
    icon: BookOpen,
  },
  {
    id: 'scanning-messages',
    label: 'Scanning messages',
    icon: MessageSquareWarning,
  },
  {
    id: 'scanning-links',
    label: 'Scanning links',
    icon: Link2,
  },
  {
    id: 'scanning-emails',
    label: 'Scanning emails',
    icon: Mail,
  },
  {
    id: 'understanding-verdicts',
    label: 'Understanding verdicts',
    icon: ShieldCheck,
  },
  {
    id: 'scan-history',
    label: 'Scan history & reports',
    icon: History,
  },
  {
    id: 'account-settings',
    label: 'Account & settings',
    icon: UserCog,
  },
  {
    id: 'reporting-issues',
    label: 'Reporting an issue',
    icon: FileText,
  },
];

const CONTENT: Record<string, { title: string; body: React.ReactNode }> = {
  'getting-started': {
    title: 'Getting started',
    body: (
      <>
        <p>
          Custos checks messages, links, and emails for signs of a scam and gives you a plain-English
          verdict along with the reasoning behind it. You can start scanning immediately as a guest —
          no account required.
        </p>
        <p>
          To try it, open the scanner, paste in whatever you want checked, and submit. Within a couple
          of seconds you'll see a verdict card showing whether the content looks safe or risky, a risk
          score, and a short explanation of what drove that score.
        </p>
        <p>
          Guest users get 5 scans per day. Creating a free account does not unlock more scans on its
          own, but it does let you save your scan history and revisit past results. Unlimited scans are
          available on the Plus plan.
        </p>
      </>
    ),
  },
  'scanning-messages': {
    title: 'Scanning messages',
    body: (
      <>
        <p>
          Paste the full text of an SMS, WhatsApp message, or social media DM into the scanner. Include
          the sender's name or number if you have it — this helps Custos check for impersonation of
          known organizations like banks or delivery services.
        </p>
        <p>Custos looks for patterns commonly used in scam messages, including:</p>
        <ul>
          <li>Urgency or threat language, such as warnings about account suspension</li>
          <li>Requests to click a link or call a number to "verify" something</li>
          <li>Impersonation of banks, couriers, government agencies, or well-known brands</li>
          <li>Unusual sender numbers or IDs that don't match the organization being referenced</li>
        </ul>
        <p>
          If the message contains a link, Custos will also analyze that link as part of the same scan —
          you don't need to submit it separately.
        </p>
      </>
    ),
  },
  'scanning-links': {
    title: 'Scanning links',
    body: (
      <>
        <p>
          Paste any URL into the scanner before you click it. Custos checks the domain's age,
          registration details, redirect chain, and certificate history, and compares it against known
          scam infrastructure patterns.
        </p>
        <p>Things the link scanner pays attention to:</p>
        <ul>
          <li>How recently the domain was registered</li>
          <li>Whether the link redirects through several different domains before landing</li>
          <li>Whether the hosting matches what a legitimate organization would use</li>
          <li>Lookalike domains designed to resemble a trusted brand at a glance</li>
        </ul>
        <p>
          The verdict explains exactly which of these signals contributed to the score, so you can learn
          to recognize similar patterns yourself next time.
        </p>
      </>
    ),
  },
  'scanning-emails': {
    title: 'Scanning emails',
    body: (
      <>
        <p>
          For the most accurate email scan, paste both the headers and the body of the email if you can.
          Most email clients let you view the "original message" or "show source" to copy the full
          headers.
        </p>
        <p>Custos performs a full header-to-body analysis, including:</p>
        <ul>
          <li>Checking sender authentication records for signs of spoofing</li>
          <li>Flagging display-name spoofing and lookalike sending domains</li>
          <li>Matching patterns common in business email compromise and invoice fraud</li>
          <li>Reading the body for urgency, unusual requests, or mismatched links</li>
        </ul>
        <p>
          If you only have the body text and not the headers, you can still scan it — the verdict will
          note that header analysis was not available and rely on the body content instead.
        </p>
      </>
    ),
  },
  'understanding-verdicts': {
    title: 'Understanding verdicts',
    body: (
      <>
        <p>
          Every scan returns one of two verdicts — safe or scam — along with a risk score from 0 to 100
          and a short explanation of what drove that result. Custos never gives just a number; the
          reasoning is always visible.
        </p>
        <p>
          A higher risk score means more signals were found that match known scam patterns. A low score
          doesn't guarantee something is completely safe, especially for very new or unusual scam
          formats — it means nothing familiar was detected.
        </p>
        <p>
          If a verdict looks wrong to you, you can flag it directly from the result page using the
          "Report this verdict" option. Our team reviews reported scans to keep detection accurate over
          time.
        </p>
      </>
    ),
  },
  'scan-history': {
    title: 'Scan history & reports',
    body: (
      <>
        <p>
          Signed-in users automatically get an encrypted, private scan history. You can revisit any past
          scan, compare it against a new one, or delete it permanently at any time from your dashboard.
        </p>
        <p>
          Guest scans are never stored anywhere — once you close the tab, that scan is gone, so sign in
          first if you want to keep a record.
        </p>
        <p>
          Plus and Teams users can export any individual scan as a clean PDF report, useful for sharing
          with a bank, filing a complaint, or keeping records for your organization.
        </p>
      </>
    ),
  },
  'account-settings': {
    title: 'Account & settings',
    body: (
      <>
        <p>
          You can manage your plan, payment method, and notification preferences from Account Settings.
          Changes to a higher plan apply immediately; downgrades take effect at the end of your current
          billing period.
        </p>
        <p>
          If you signed up with Google, use "Continue with Google" to sign in — there's no separate
          password to manage. If you signed up with email and password, use the "Forgot password" link
          on the sign-in page to reset it.
        </p>
        <p>
          Deleting your account permanently removes your scan history and personal data within 30 days.
          This option is available under Account Settings &gt; Privacy.
        </p>
      </>
    ),
  },
  'reporting-issues': {
    title: 'Reporting an issue',
    body: (
      <>
        <p>
          If a verdict seems incorrect, use the "Report this verdict" button on the result page. Include
          any context you think is relevant — our team reviews every report.
        </p>
        <p>
          For account, billing, or technical issues, reach out through the Support page. Free plan
          requests are typically answered within 2 business days, Plus within 1 business day, and Teams
          customers get a dedicated response time as part of their plan.
        </p>
      </>
    ),
  },
};

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('getting-started');
  const active = CONTENT[activeSection];

  return (
    <main className="bg-[#F6F4EF] text-[#3A3A34]" style={{ fontFamily: 'var(--font-body)' }}>
      <Header />

      <section className="px-6 pt-14 pb-6 md:pt-20">
        <div className="container mx-auto max-w-6xl">
          <p className="text-[12px] font-bold uppercase tracking-widest text-[#0E6E5C] mb-3">Docs</p>
          <h1
            className="text-[32px] md:text-[42px] font-normal text-[#14181A] tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Learn how to use Custos.
          </h1>
          <p className="mt-3 text-[15.5px] text-[#5C5A4E] leading-relaxed max-w-xl">
            A plain-language guide to scanning messages, links, and emails, and understanding what each
            verdict means.
          </p>
        </div>
      </section>

      <section className="px-6 pb-20 md:pb-28">
        <div className="container mx-auto max-w-6xl flex flex-col md:flex-row gap-10 md:gap-12">
          {/* Sidebar navigation */}
          <aside className="md:w-64 shrink-0">
            <div className="md:sticky md:top-24">
              <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
                {NAV_SECTIONS.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`shrink-0 md:w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-[14px] font-medium text-left transition-colors whitespace-nowrap md:whitespace-normal ${
                        isActive
                          ? 'bg-[#14181A] text-white'
                          : 'text-[#5C5A4E] hover:bg-white hover:text-[#14181A]'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#4FCBA9]' : 'text-[#0E6E5C]'}`} />
                      {section.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl border border-[#DEDACD] p-8 md:p-10">
              <div className="flex items-center gap-2 text-[12.5px] text-[#8A8574] mb-4">
                <span>Docs</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-[#14181A] font-medium">{active.title}</span>
              </div>
              <h2
                className="text-[26px] md:text-[30px] font-normal text-[#14181A] tracking-tight mb-6"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {active.title}
              </h2>
              <div className="prose-custom space-y-4 text-[15px] text-[#3A3A34] leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_li]:text-[#3A3A34]">
                {active.body}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}