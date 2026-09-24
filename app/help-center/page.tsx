'use client';

import React, { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import {
  Search,
  BookOpen,
  MessageSquareWarning,
  CreditCard,
  UserCog,
  ShieldCheck,
  Wrench,
  Mail,
  MessageCircle,
  ArrowRight,
  ChevronDown,
  X,
} from 'lucide-react';

type Article = {
  id: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
};

const CATEGORIES = [
  { id: 'getting-started', label: 'Getting started', icon: BookOpen },
  { id: 'scanning', label: 'Scanning', icon: MessageSquareWarning },
  { id: 'billing', label: 'Billing & plans', icon: CreditCard },
  { id: 'account', label: 'Account', icon: UserCog },
  { id: 'privacy-security', label: 'Privacy & security', icon: ShieldCheck },
  { id: 'troubleshooting', label: 'Troubleshooting', icon: Wrench },
];

const ARTICLES: Article[] = [
  {
    id: 'a1',
    category: 'getting-started',
    title: 'What can I scan with Custos?',
    excerpt: 'Any SMS, WhatsApp message, DM, email, or link.',
    body: 'Paste any SMS, WhatsApp message, social media DM, email, or link into the scanner and Custos analyzes it the same careful way regardless of where it came from. If a message contains a link, it gets checked automatically as part of the same scan.',
  },
  {
    id: 'a2',
    category: 'getting-started',
    title: 'Do I need an account to try it?',
    excerpt: 'No — start scanning as a guest right away.',
    body: 'Tap "Try Custos" and you land straight in the scanner as a guest, with 5 free scans per day. Sign up when you want unlimited scans, saved history, and downloadable reports.',
  },
  {
    id: 'a3',
    category: 'getting-started',
    title: 'How long does a scan take?',
    excerpt: 'Most verdicts return in under two seconds.',
    body: 'Message and link scans typically return a verdict in under two seconds. Email scans with full headers may take slightly longer since there is more to analyze.',
  },
  {
    id: 'a4',
    category: 'scanning',
    title: 'Understanding your verdict and risk score',
    excerpt: 'Every scan explains its reasoning, not just a score.',
    body: 'Every scan returns a verdict — safe or scam — plus a risk score from 0 to 100 and a plain-English explanation of what drove that result. A low score means nothing familiar was detected, not an absolute guarantee of safety.',
  },
  {
    id: 'a5',
    category: 'scanning',
    title: 'Scanning an email with full headers',
    excerpt: 'Copy headers for the most accurate spoofing analysis.',
    body: 'For the most accurate result, paste both the headers and body of the email. Most email clients let you view "original message" or "show source" to copy the full headers, which lets Custos check sender authentication records for spoofing.',
  },
  {
    id: 'a6',
    category: 'scanning',
    title: 'What if I think a verdict is wrong?',
    excerpt: 'Report it directly from the result page.',
    body: 'Use the "Report this verdict" button on the result page. Our team reviews every reported scan, which helps keep detection accurate over time.',
  },
  {
    id: 'a7',
    category: 'billing',
    title: 'Is the Free plan actually free?',
    excerpt: 'Yes — 5 scans a day, no card required.',
    body: 'The Free plan includes 5 scans per day with no card required and no trial that quietly starts billing you. Upgrade to Plus only when you need unlimited scans.',
  },
  {
    id: 'a8',
    category: 'billing',
    title: 'How do I upgrade or downgrade my plan?',
    excerpt: 'Manage your plan from Account Settings > Billing.',
    body: 'Go to Account Settings > Billing to change plans. Upgrades apply immediately; downgrades take effect at the end of your current billing period, so you keep access to what you already paid for.',
  },
  {
    id: 'a9',
    category: 'billing',
    title: 'Can I cancel Plus anytime?',
    excerpt: 'Yes, with no cancellation fee.',
    body: 'Cancel anytime from Account Settings. You keep full access until the end of the billing period you already paid for — there is no cancellation fee.',
  },
  {
    id: 'a10',
    category: 'account',
    title: 'I forgot my password',
    excerpt: 'Use the reset link on the sign-in page.',
    body: 'Use the "Forgot password" link on the sign-in page to reset it by email. If you originally signed up with Google, use "Continue with Google" instead — there is no separate password to manage.',
  },
  {
    id: 'a11',
    category: 'account',
    title: 'How do I delete my account?',
    excerpt: 'Permanent deletion available in Privacy settings.',
    body: 'Go to Account Settings > Privacy and choose "Delete account." This permanently removes your scan history and personal data within 30 days.',
  },
  {
    id: 'a12',
    category: 'account',
    title: 'Can multiple people share one account?',
    excerpt: 'Individual accounts are for one person — use Teams for shared access.',
    body: 'Personal accounts are meant for a single user. If you need shared access for a team or organization, the Teams plan includes a shared workspace with multiple seats and admin controls.',
  },
  {
    id: 'a13',
    category: 'privacy-security',
    title: 'Do you store the messages I scan?',
    excerpt: 'Guest scans are never stored; saved scans are encrypted.',
    body: 'Guest scans are never stored anywhere — once you close the tab, that scan is gone. Signed-in users can choose to save scans to their private, encrypted history, and can delete any scan permanently at any time.',
  },
  {
    id: 'a14',
    category: 'privacy-security',
    title: 'Could Custos itself be spoofed or phished?',
    excerpt: 'We never ask for your password inside a scan result.',
    body: 'We publish our sending domains and never ask for your password or card details inside a scan result. If something claiming to be Custos asks for credentials by email or DM, it isn\'t us — scan it and see for yourself.',
  },
  {
    id: 'a15',
    category: 'troubleshooting',
    title: 'The scanner is not loading',
    excerpt: 'Try a refresh first, then check our status page.',
    body: 'Try refreshing the page first. If the issue continues, check our status page for any ongoing incidents, or contact support with a screenshot of what you\'re seeing.',
  },
  {
    id: 'a16',
    category: 'troubleshooting',
    title: 'I was charged but my plan still shows Free',
    excerpt: 'Usually a brief sync delay — contact us if it persists.',
    body: 'This is usually a brief sync delay after payment. If your plan has not updated within 15 minutes, contact support with your receipt and we will fix it right away.',
  },
];

export default function HelpCenterPage() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [openArticle, setOpenArticle] = useState<string | null>(null);

  const results = useMemo(() => {
    let list = ARTICLES;
    if (activeCategory) {
      list = list.filter((a) => a.category === activeCategory);
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.excerpt.toLowerCase().includes(q) ||
          a.body.toLowerCase().includes(q)
      );
    }
    return list;
  }, [query, activeCategory]);

  const isSearching = query.trim().length > 0 || activeCategory !== null;

  return (
    <main className="bg-[#F6F4EF] text-[#3A3A34]" style={{ fontFamily: 'var(--font-body)' }}>
      <Header />

      {/* Hero + search */}
      <section className="px-6 pt-16 pb-10 md:pt-24 md:pb-14">
        <div className="container mx-auto max-w-2xl text-center">
          <p className="text-[12px] font-bold uppercase tracking-widest text-[#0E6E5C] mb-3">
            Help center
          </p>
          <h1
            className="text-[34px] md:text-[46px] font-normal text-[#14181A] tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            How can we help?
          </h1>

          <div className="mt-8 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#8A8574]" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveCategory(null);
              }}
              placeholder="Search for an answer..."
              className="w-full pl-12 pr-11 py-4 bg-white border border-[#DEDACD] rounded-2xl focus:ring-2 focus:ring-[#0E6E5C]/20 focus:border-[#0E6E5C] outline-none transition-all text-[15px] text-[#14181A] placeholder:text-[#8A8574] shadow-[0_20px_50px_-25px_rgba(20,24,26,0.35)]"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8A8574] hover:text-[#14181A]"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      {isSearching ? (
        /* Search / category results */
        <section className="px-6 pb-20 md:pb-28">
          <div className="container mx-auto max-w-3xl">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <p className="text-[14px] text-[#5C5A4E]">
                {results.length} {results.length === 1 ? 'result' : 'results'}
                {activeCategory && (
                  <>
                    {' '}
                    in{' '}
                    <span className="font-semibold text-[#14181A]">
                      {CATEGORIES.find((c) => c.id === activeCategory)?.label}
                    </span>
                  </>
                )}
              </p>
              {(query || activeCategory) && (
                <button
                  onClick={() => {
                    setQuery('');
                    setActiveCategory(null);
                  }}
                  className="text-[13px] font-semibold text-[#0E6E5C] underline underline-offset-2"
                >
                  Clear filters
                </button>
              )}
            </div>

            {results.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#DEDACD] p-10 text-center">
                <p className="text-[15px] text-[#5C5A4E]">
                  No articles matched your search. Try different words, or{' '}
                  <a href="/support" className="text-[#0E6E5C] underline underline-offset-2">
                    contact support
                  </a>{' '}
                  directly.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#DEDACD] border-t border-b border-[#DEDACD]">
                {results.map((a) => (
                  <div key={a.id}>
                    <button
                      onClick={() => setOpenArticle(openArticle === a.id ? null : a.id)}
                      className="w-full flex items-center justify-between gap-4 py-5 text-left hover:bg-white/60 transition-colors"
                    >
                      <div>
                        <span className="text-[15px] font-semibold text-[#14181A]">{a.title}</span>
                        <p className="text-[13.5px] text-[#8A8574] mt-0.5">{a.excerpt}</p>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 shrink-0 text-[#8A8574] transition-transform ${
                          openArticle === a.id ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {openArticle === a.id && (
                      <div className="pb-5 text-[14.5px] text-[#5C5A4E] leading-relaxed">{a.body}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : (
        <>
          {/* Category grid */}
          <section className="px-6 pb-16 md:pb-20 bg-white">
            <div className="container mx-auto max-w-5xl">
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const count = ARTICLES.filter((a) => a.category === cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className="text-left rounded-2xl border border-[#DEDACD] p-6 bg-[#F6F4EF] hover:border-[#0E6E5C]/40 hover:-translate-y-0.5 transition-all"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white border border-[#DEDACD] flex items-center justify-center mb-4">
                        <Icon className="w-4.5 h-4.5 text-[#0E6E5C]" />
                      </div>
                      <h3 className="text-[15.5px] font-semibold text-[#14181A]">{cat.label}</h3>
                      <p className="mt-1 text-[13px] text-[#8A8574]">{count} articles</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Popular articles */}
          <section className="px-6 py-16 md:py-24">
            <div className="container mx-auto max-w-3xl">
              <div className="mb-10">
                <p className="text-[12px] font-bold uppercase tracking-widest text-[#0E6E5C] mb-3">
                  Popular articles
                </p>
                <h2
                  className="text-[26px] md:text-[30px] font-normal text-[#14181A] tracking-tight"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Frequently read.
                </h2>
              </div>

              <div className="divide-y divide-[#DEDACD] border-t border-b border-[#DEDACD]">
                {ARTICLES.slice(0, 6).map((a) => (
                  <div key={a.id}>
                    <button
                      onClick={() => setOpenArticle(openArticle === a.id ? null : a.id)}
                      className="w-full flex items-center justify-between gap-4 py-5 text-left hover:bg-white/60 transition-colors"
                    >
                      <div>
                        <span className="text-[15px] font-semibold text-[#14181A]">{a.title}</span>
                        <p className="text-[13.5px] text-[#8A8574] mt-0.5">{a.excerpt}</p>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 shrink-0 text-[#8A8574] transition-transform ${
                          openArticle === a.id ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {openArticle === a.id && (
                      <div className="pb-5 text-[14.5px] text-[#5C5A4E] leading-relaxed">{a.body}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {/* Contact strip */}
      <section className="px-6 pb-16 md:pb-24">
        <div className="container mx-auto max-w-5xl">
          <div className="bg-white rounded-2xl border border-[#DEDACD] p-8 md:p-10 grid md:grid-cols-3 gap-8 items-center">
            <div className="md:col-span-2">
              <h2
                className="text-[20px] md:text-[24px] font-normal text-[#14181A] tracking-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Can't find what you're looking for?
              </h2>
              <p className="mt-2 text-[14.5px] text-[#5C5A4E] leading-relaxed">
                Reach our support team directly and a real person will get back to you.
              </p>
              <div className="mt-4 flex flex-wrap gap-4 text-[13.5px] text-[#5C5A4E]">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#0E6E5C]" />
                  support@custos.ai
                </span>
                <span className="flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-[#0E6E5C]" />
                  Live chat for Plus & Teams
                </span>
              </div>
            </div>
            <a
              href="/support"
              className="inline-flex items-center justify-center gap-2 bg-[#14181A] hover:bg-[#0E6E5C] text-white font-semibold px-6 py-3.5 rounded-full transition-colors"
            >
              Contact support
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}