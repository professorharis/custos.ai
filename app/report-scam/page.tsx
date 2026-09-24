'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Flag, Mail, Link2, MessageSquareWarning, CheckCircle2 } from 'lucide-react';

const REPORT_TYPES = [
  { icon: MessageSquareWarning, label: 'Message / SMS / DM' },
  { icon: Link2, label: 'Link' },
  { icon: Mail, label: 'Email' },
];

export default function ReportScamPage() {
  const [selectedType, setSelectedType] = useState(0);
  const [content, setContent] = useState('');
  const [contact, setContact] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitted(true);
  };

  return (
    <main className="bg-[#F6F4EF] text-[#3A3A34]" style={{ fontFamily: 'var(--font-body)' }}>
      <Header />

      <section className="px-6 pt-16 pb-10 md:pt-24 md:pb-14">
        <div className="container mx-auto max-w-3xl text-center">
          <p className="text-[12px] font-bold uppercase tracking-widest text-[#D6483F] mb-3">
            Report a scam
          </p>
          <h1
            className="text-[36px] md:text-[48px] font-normal text-[#14181A] tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Seen a scam? Help us flag it.
          </h1>
          <p className="mt-4 text-[16px] text-[#5C5A4E] leading-relaxed">
            Reports you submit here help improve detection for everyone. For an instant verdict on
            something you're not sure about, use the{' '}
            <a href="/scanner" className="text-[#0E6E5C] underline underline-offset-2">
              scanner
            </a>{' '}
            instead — this form is for reporting confirmed or suspected scams to our team.
          </p>
        </div>
      </section>

      <section className="px-6 pb-20 md:pb-28">
        <div className="container mx-auto max-w-2xl">
          {submitted ? (
            <div className="bg-white rounded-2xl border border-[#DEDACD] p-10 text-center">
              <CheckCircle2 className="w-10 h-10 text-[#0E6E5C] mx-auto mb-4" />
              <h2
                className="text-[22px] font-normal text-[#14181A] tracking-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Thanks for the report.
              </h2>
              <p className="mt-2 text-[14.5px] text-[#5C5A4E] leading-relaxed">
                Our team reviews every submission. If you left contact details, we'll follow up if we
                need more information.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setContent('');
                  setContact('');
                }}
                className="mt-6 text-[14px] font-semibold text-[#0E6E5C] underline underline-offset-2"
              >
                Submit another report
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl border border-[#DEDACD] p-8 md:p-10 space-y-6"
            >
              <div>
                <label className="block text-[12px] font-semibold text-[#8A8574] uppercase tracking-wide mb-3">
                  What kind of scam is this?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {REPORT_TYPES.map((type, i) => {
                    const Icon = type.icon;
                    const isActive = selectedType === i;
                    return (
                      <button
                        type="button"
                        key={type.label}
                        onClick={() => setSelectedType(i)}
                        className={`flex flex-col items-center gap-2 py-4 rounded-xl border text-[12.5px] font-medium transition-colors ${
                          isActive
                            ? 'border-[#0E6E5C] bg-[#0E6E5C]/5 text-[#0E6E5C]'
                            : 'border-[#DEDACD] text-[#5C5A4E] hover:border-[#0E6E5C]/40'
                        }`}
                      >
                        <Icon className="w-4.5 h-4.5" />
                        {type.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#8A8574] uppercase tracking-wide mb-2">
                  Paste the message, link, or email content
                </label>
                <textarea
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                  placeholder="Paste the full text here, including sender details if you have them..."
                  className="w-full px-4 py-3 bg-[#F6F4EF] border border-[#DEDACD] rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0E6E5C]/20 focus:border-[#0E6E5C] outline-none transition-all text-[14px] text-[#14181A] placeholder:text-[#8A8574] resize-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#8A8574] uppercase tracking-wide mb-2">
                  Your email (optional, in case we need more details)
                </label>
                <input
                  type="email"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 bg-[#F6F4EF] border border-[#DEDACD] rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0E6E5C]/20 focus:border-[#0E6E5C] outline-none transition-all text-[14px] text-[#14181A] placeholder:text-[#8A8574]"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-[#14181A] hover:bg-[#0E6E5C] text-white font-semibold py-3.5 rounded-xl transition-all text-[14px]"
              >
                <Flag className="w-4 h-4" />
                Submit report
              </button>

              <p className="text-[12.5px] text-[#8A8574] text-center leading-relaxed">
                Reports are reviewed by our team and used to improve detection. This form does not
                report the scam to law enforcement — for that, contact your local authorities or your
                bank directly if money was involved.
              </p>
            </form>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}