'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { supabase } from '@/lib/supabase';
import {
  ShieldCheck,
  ShieldAlert,
  Link2,
  Mail,
  MessageSquareWarning,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
} from 'lucide-react';

// ── Online security / scam-protection images (Unsplash — free to use) ──
const SECURITY_IMAGES = {
  hero: 'https://images.unsplash.com/photo-1633265486064-086b219458ec?q=80&w=1200&auto=format&fit=crop',
};

const FEATURES = [
  {
    icon: MessageSquareWarning,
    title: 'Message & DM detection',
    description:
      'Paste an SMS, WhatsApp, or DM and Custos reads it the way a scammer wrote it — urgency cues, fake giveaways, impersonation language — then hands back a plain‑English verdict in seconds.',
    sample: {
      kind: 'SMS',
      from: '+92 21 111 222 333 · "HBLBank"',
      body: 'HBL Alert: Your debit card has been temporarily blocked due to unusual activity. Verify now to avoid permanent suspension: hbl-verify-secure.com/auth',
      verdict: 'scam' as const,
      score: 97,
    },
  },
  {
    icon: Link2,
    title: 'Link & domain analysis',
    description:
      'Drop in any link before you tap it. Custos checks domain age, redirect chains, certificate history, and known scam patterns — and tells you exactly which of those raised the flag.',
    sample: {
      kind: 'Link',
      from: 'sharepoint-online.azurewebsites.net/s/auth?q=3f8d2a',
      body: 'Registered 6 days ago · hosted on a free app subdomain, not sharepoint.com · no organizational certificate',
      verdict: 'scam' as const,
      score: 93,
    },
  },
  {
    icon: Mail,
    title: 'Email & spoofing checks',
    description:
      'Full header‑to‑body analysis catches spoofed senders and business‑email compromise, not just bad spelling. You get a highlighted breakdown of every suspicious element, not a black‑box score.',
    sample: {
      kind: 'Email',
      from: 'no-reply@sharepoint-online.azurewebsites.net',
      body: '"Action Required: Q3_Financial_Review_Final.pdf has been shared with you. Expires 24 hours from receipt — open document to approve changes before EOD."',
      verdict: 'scam' as const,
      score: 95,
    },
  },
];

const COMPARISON = {
  legit: {
    tag: 'Real notification',
    from: 'calendar-notification@zoom.us',
    subject: 'Meeting reminder: Weekly Sync in 15 minutes',
    body: 'Hi Sarah, this is a reminder that "Weekly Sync" starts at 3:00 PM (PKT). Join from your calendar or the Zoom app — no action needed here.',
    verdict: 'safe' as const,
  },
  scam: {
    tag: 'Phishing attempt',
    from: 'no-reply@sharepoint-online.azurewebsites.net',
    subject: 'Action Required: "Q3_Financial_Review_Final.pdf" has been shared with you',
    body: 'John Carter has shared a secure document with you via Microsoft SharePoint Online. Expires 24 hours from receipt of this email. Open Document: sharepoint-online.azurewebsites.net/s/auth?q=3f8d2a&tenant=us',
    verdict: 'scam' as const,
  },
};

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
      'Plain‑English risk score',
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
      'Full follow‑up chat on every scan',
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
      'API access',
      'SSO & audit logs',
      'Dedicated onboarding',
    ],
  },
];

const TESTIMONIALS = [
  {
    quote:
      "I nearly paid a 'delivery fee' on a fake courier text. Custos flagged it in two seconds and explained exactly why — the domain, the tone, all of it.",
    author: 'Ayesha R.',
    role: 'Freelance designer',
  },
  {
    quote:
      'We run every inbound vendor email through Custos before finance touches it. It has caught two spoofed invoices this quarter alone.',
    author: 'Bilal K.',
    role: 'Finance lead, mid‑size retailer',
  },
  {
    quote:
      "My parents forward me suspicious texts weekly. Now I just tell them to paste it into Custos first — it's the only security tool they've stuck with.",
    author: 'Sana M.',
    role: 'IT support specialist',
  },
];

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
      q: 'Do Teams plans support single sign‑on?',
      a: 'Yes. Teams includes SSO, audit logs, and an API key for wiring Custos into your own inbox or ticketing workflow.',
    },
  ],
  Security: [
    {
      q: 'Do you store the messages I scan?',
      a: 'Guest scans are never stored. Signed‑in scans are saved to your private history only, encrypted at rest, so you can revisit a report later — and you can delete any scan permanently at any time.',
    },
    {
      q: 'Could Custos itself be spoofed or phished?',
      a: "We publish our sending domains and never ask for your password inside a scan result. If something claiming to be Custos asks for credentials by email or DM, it isn't us — scan it and see.",
    },
  ],
};

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function Seal({
  label,
  variant,
  size = 'md',
}: {
  label: string;
  variant: 'safe' | 'scam';
  size?: 'sm' | 'md';
}) {
  const color = variant === 'safe' ? '#0E6E5C' : '#D6483F';
  const dims = size === 'sm' ? 'w-16 h-16 text-[7px]' : 'w-24 h-24 text-[9px]';
  return (
    <div
      className={`${dims} shrink-0 rounded-full flex items-center justify-center text-center font-bold uppercase tracking-widest leading-tight -rotate-6 select-none`}
      style={{
        color,
        border: `2px dashed ${color}`,
        boxShadow: `inset 0 0 0 3px ${color}0f`,
        fontFamily: 'var(--font-mono)',
      }}
    >
      <span className="px-2">{label}</span>
    </div>
  );
}

function VerdictCard({
  kind,
  from,
  body,
  verdict,
  score,
}: {
  kind: string;
  from: string;
  body: string;
  verdict: 'safe' | 'scam';
  score?: number;
}) {
  const isScam = verdict === 'scam';
  return (
    <div className="relative w-full max-w-sm mx-auto bg-white rounded-2xl border border-[#DEDACD] shadow-[0_20px_50px_-25px_rgba(20,24,26,0.35)] p-5 overflow-visible">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#8A8574]">
          {kind}
        </span>
        <span className="text-[10px] text-[#8A8574] font-mono truncate max-w-[55%]">{from}</span>
      </div>
      <p className="text-[13px] text-[#3A3A34] font-mono leading-relaxed border-t border-[#EAE6DB] pt-3">
        {body}
      </p>
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#EAE6DB]">
        <span
          className={`text-xs font-bold flex items-center gap-1.5 ${
            isScam ? 'text-[#D6483F]' : 'text-[#0E6E5C]'
          }`}
        >
          {isScam ? <ShieldAlert className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
          {isScam ? 'Scam detected' : 'Verified safe'}
        </span>
        {typeof score === 'number' && (
          <span className="text-[10px] text-[#8A8574] font-mono">Risk score: {score}%</span>
        )}
      </div>
      <div className="absolute -right-4 -top-4">
        <Seal label={isScam ? 'Scam' : 'Safe'} variant={isScam ? 'scam' : 'safe'} size="sm" />
      </div>
    </div>
  );
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeFaqTab, setActiveFaqTab] = useState<string>('General');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [heroEmail, setHeroEmail] = useState('');
  const [heroPassword, setHeroPassword] = useState('');
  const [heroError, setHeroError] = useState('');
  const [heroLoading, setHeroLoading] = useState(false);
  const [formMode, setFormMode] = useState<'signup' | 'signin'>('signup');

  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const testimonialsRef = useRef<HTMLDivElement>(null);

  const handleTryCustos = () => router.push('/scanner');

  // Header "Sign in" navigates to /?signin=1 → switch the hero form to sign-in mode
  useEffect(() => {
    if (searchParams.get('signin') === '1') {
      setFormMode('signin');
      setHeroError('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [searchParams]);

  const handleGoogleSignup = async () => {
    setHeroError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/scanner` },
    });
    if (error) setHeroError(error.message);
  };

  const handleHeroSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setHeroError('');
    if (!heroEmail || !/^\S+@\S+\.\S+$/.test(heroEmail)) {
      setHeroError('Enter a valid email to continue.');
      return;
    }
    if (!heroPassword || heroPassword.length < 6) {
      setHeroError('Password must be at least 6 characters.');
      return;
    }
    setHeroLoading(true);
    const { error } = await supabase.auth.signUp({
      email: heroEmail,
      password: heroPassword,
      options: { emailRedirectTo: `${window.location.origin}/scanner` },
    });
    setHeroLoading(false);
    if (error) setHeroError(error.message);
    else alert('Account created! Check your email to confirm.');
  };

  const handleHeroSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    setHeroError('');
    if (!heroEmail || !/^\S+@\S+\.\S+$/.test(heroEmail)) {
      setHeroError('Enter a valid email to continue.');
      return;
    }
    setHeroLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: heroEmail,
      options: { emailRedirectTo: `${window.location.origin}/scanner` },
    });
    setHeroLoading(false);
    if (error) setHeroError(error.message);
    else alert('Check your email for the magic link!');
  };

  const toggleFormMode = () => {
    setFormMode((prev) => (prev === 'signup' ? 'signin' : 'signup'));
    setHeroError('');
  };

  useEffect(() => {
    const container = testimonialsRef.current;
    if (!container) return;
    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const itemWidth = container.offsetWidth;
      const index = Math.round(scrollLeft / itemWidth);
      setActiveTestimonial(index);
    };
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTestimonial = (index: number) => {
    const container = testimonialsRef.current;
    if (!container) return;
    container.scrollTo({ left: index * container.offsetWidth, behavior: 'smooth' });
  };

  return (
    <main id="top" className="bg-[#F6F4EF] text-[#3A3A34] overflow-x-hidden" style={{ fontFamily: 'var(--font-body)' }}>
      <style jsx global>{`
        :root {
          /* Headings now use the same sans font as the secondary pages */
          --font-display: var(--font-body);
          --font-mono: var(--font-geist-mono), 'SFMono-Regular', Consolas, monospace;
        }
        @keyframes stampIn {
          0% { transform: scale(1.6) rotate(-6deg); opacity: 0; }
          60% { transform: scale(0.94) rotate(-6deg); opacity: 1; }
          100% { transform: scale(1) rotate(-6deg); opacity: 1; }
        }
        .stamp-in { animation: stampIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both; }
        html { scroll-behavior: smooth; }
        .carousel-scroll::-webkit-scrollbar { display: none; }
        .carousel-scroll { -ms-overflow-style: none; scrollbar-width: none; }

        @keyframes scanSweep {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .scan-sweep { animation: scanSweep 4s ease-in-out infinite; }

        @media (max-width: 640px) {
          .verdict-card-container { max-width: 100% !important; }
        }
      `}</style>

      {/* ── Header (not sticky, same on every page) ── */}
      <Header />

      {/* ────────────────────────── HERO ────────────────────────── */}
      <section className="px-6 pt-14 pb-16 md:pt-28 md:pb-32">
        <div className="container mx-auto max-w-6xl grid md:grid-cols-[1.15fr_1fr] gap-14 md:gap-20 items-center">
          <div>
            <h1
              className="text-[30px] sm:text-[38px] md:text-[46px] font-normal text-[#14181A] tracking-[-0.02em] leading-[1.1]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Know the Threat
              <br />
              before it costs you.
            </h1>
            <p className="mt-5 md:mt-6 text-[16px] md:text-[17px] text-[#5C5A4E] max-w-md leading-[1.7]">
              Paste any text, message, email, or link. Custos reads it the way a scammer wrote it, and hands you a clear, explained verdict in seconds.
            </p>

            <div className="mt-9 w-full max-w-sm bg-white rounded-2xl border border-[#DEDACD] shadow-[0_30px_60px_-30px_rgba(20,24,26,0.3)] overflow-hidden">
              <div className="bg-[#0E6E5C] text-white text-center py-4 px-5">
                <h3
                  className="text-[18px] font-medium tracking-tight"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {formMode === 'signup' ? 'Get started free' : 'Welcome back'}
                </h3>
                <p className="text-[13px] text-[#DCDAD0] mt-1">
                  {formMode === 'signup'
                    ? 'No credit card required. Start scanning in seconds.'
                    : 'Sign in to continue scanning.'}
                </p>
              </div>

              <div className="p-6 flex flex-col">
                {heroError && (
                  <div className="mb-4 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 text-[12.5px] text-red-700">
                    {heroError}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleGoogleSignup}
                  className="w-full flex items-center justify-center gap-3 bg-white border border-[#DEDACD] text-[#14181A] font-semibold py-3 rounded-xl hover:bg-[#F6F4EF] hover:border-[#0E6E5C]/40 active:scale-[0.98] transition-all text-[14px]"
                >
                  <GoogleIcon />
                  {formMode === 'signup' ? 'Create account with Google' : 'Continue with Google'}
                </button>

                <div className="flex items-center gap-4 my-5">
                  <div className="flex-1 border-t border-[#EAE6DB]" />
                  <span className="text-[10.5px] font-bold text-[#8A8574] uppercase tracking-widest">or</span>
                  <div className="flex-1 border-t border-[#EAE6DB]" />
                </div>

                <form
                  onSubmit={formMode === 'signup' ? handleHeroSignup : handleHeroSignin}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold text-[#8A8574] uppercase tracking-wide">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-[#8A8574]" strokeWidth={1.5} />
                      <input
                        type="email"
                        required
                        value={heroEmail}
                        onChange={(e) => setHeroEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-4 py-3 bg-[#F6F4EF] border border-[#DEDACD] rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0E6E5C]/20 focus:border-[#0E6E5C] outline-none transition-all text-[14px] text-[#14181A] placeholder:text-[#8A8574]"
                      />
                    </div>
                  </div>

                  {formMode === 'signup' && (
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-semibold text-[#8A8574] uppercase tracking-wide">Password</label>
                      <div className="relative">
                        <input
                          type="password"
                          required
                          value={heroPassword}
                          onChange={(e) => setHeroPassword(e.target.value)}
                          placeholder="Create a password"
                          className="w-full px-4 py-3 bg-[#F6F4EF] border border-[#DEDACD] rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0E6E5C]/20 focus:border-[#0E6E5C] outline-none transition-all text-[14px] text-[#14181A] placeholder:text-[#8A8574]"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={heroLoading}
                    className="w-full flex items-center justify-center gap-2 bg-[#14181A] hover:bg-[#0E6E5C] disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all active:scale-[0.98] text-[14px] shadow-sm"
                  >
                    {heroLoading ? (
                      <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <>
                        <span>{formMode === 'signup' ? 'Create account' : 'Continue with email'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <p className="text-[12px] text-[#8A8574] text-center leading-tight">
                    By continuing, you acknowledge Custos{' '}
                    <a href="/privacy" className="underline hover:text-[#0E6E5C]">Privacy Policy</a>.
                  </p>
                </form>

                <button
                  onClick={toggleFormMode}
                  className="mt-4 text-[13px] text-[#8A8574] hover:text-[#14181A] underline underline-offset-2 transition-colors text-center"
                >
                  {formMode === 'signup'
                    ? 'Already have an account? Sign in'
                    : "Don't have an account? Sign up"}
                </button>
              </div>
            </div>
          </div>

          {/* ── Security image with viewfinder frame ── */}
          <div className="relative flex justify-center md:justify-end">
            <div className="relative w-full max-w-xl aspect-square">
              <div className="absolute -top-3 -left-3 w-10 h-10 border-t-2 border-l-2 border-[#0E6E5C] rounded-tl-xl z-20" />
              <div className="absolute -top-3 -right-3 w-10 h-10 border-t-2 border-r-2 border-[#0E6E5C] rounded-tr-xl z-20" />
              <div className="absolute -bottom-3 -left-3 w-10 h-10 border-b-2 border-l-2 border-[#0E6E5C] rounded-bl-xl z-20" />
              <div className="absolute -bottom-3 -right-3 w-10 h-10 border-b-2 border-r-2 border-[#0E6E5C] rounded-br-xl z-20" />

              <div className="relative w-full h-full rounded-2xl overflow-hidden bg-[#14181A] border border-[#DEDACD] shadow-[0_30px_70px_-30px_rgba(20,24,26,0.45)]">
                <img
                  src={SECURITY_IMAGES.hero}
                  alt="Cybersecurity and scam protection"
                  className="w-full h-full object-cover"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-[#0E6E5C]/25 via-transparent to-[#14181A]/40 pointer-events-none" />
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="scan-sweep absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-[#4FCBA9]/20 to-transparent" />
                </div>
              </div>
            </div>

            <div className="absolute -z-10 -right-10 top-10 w-72 h-72 bg-[#0E6E5C]/10 rounded-full blur-3xl" />
          </div>
        </div>
      </section>

      {/* ────────────────────────── FEATURES ────────────────────────── */}
      <section id="features" className="px-6 py-16 md:py-24 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="max-w-xl mb-16">
            <p className="text-[12px] font-bold uppercase tracking-widest text-[#0E6E5C] mb-3">
              What Custos checks
            </p>
            <h2
              className="text-[24px] md:text-[30px] font-normal text-[#14181A] tracking-[-0.015em] leading-[1.2]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Three surfaces, one verdict engine.
            </h2>
            <p className="mt-4 text-[16px] text-[#5C5A4E] leading-relaxed">
              Every scam eventually arrives as a message, an email, or a link. Custos was built to read all three the same careful way.
            </p>
          </div>

          <div className="space-y-24">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              const isEven = i % 2 === 0;
              return (
                <div
                  key={feature.title}
                  className={`flex flex-col gap-10 items-center ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                >
                  <div className="w-full md:w-1/2 space-y-4">
                    <div className="w-11 h-11 rounded-xl bg-[#EAE6DB] flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[#0E6E5C]" />
                    </div>
                    <h3
                      className="text-[22px] font-medium text-[#14181A] tracking-tight"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {feature.title}
                    </h3>
                    <p className="text-[15.5px] text-[#5C5A4E] leading-relaxed max-w-md">
                      {feature.description}
                    </p>
                  </div>
                  <div className="w-full md:w-1/2">
                    <VerdictCard
                      kind={feature.sample.kind}
                      from={feature.sample.from}
                      body={feature.sample.body}
                      verdict={feature.sample.verdict}
                      score={feature.sample.score}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ────────────────────────── COMPARISON ────────────────────────── */}
      <section className="px-6 py-16 md:py-24 bg-[#F6F4EF]">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center max-w-xl mx-auto mb-14">
            <p className="text-[12px] font-bold uppercase tracking-widest text-[#0E6E5C] mb-3">
              Spot the difference
            </p>
            <h2
              className="text-[24px] md:text-[30px] font-normal text-[#14181A] tracking-[-0.015em] leading-[1.2]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              One of these got someone's card details.
            </h2>
            <p className="mt-4 text-[16px] text-[#5C5A4E] leading-relaxed">
              Both notifications look routine at a glance. Custos catches the difference in under two seconds — can you?
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[COMPARISON.legit, COMPARISON.scam].map((item) => (
              <div
                key={item.tag}
                className="relative bg-white rounded-2xl border border-[#DEDACD] shadow-sm p-7 space-y-4"
              >
                <span
                  className={`inline-block text-[11px] font-bold px-3 py-1 rounded-full ${
                    item.verdict === 'safe'
                      ? 'bg-[#0E6E5C]/10 text-[#0E6E5C]'
                      : 'bg-[#D6483F]/10 text-[#D6483F]'
                  }`}
                >
                  {item.tag}
                </span>
                <div className="font-mono text-[13px] text-[#3A3A34] bg-[#F6F4EF] p-4 rounded-lg leading-relaxed break-words border border-[#EAE6DB]">
                  <p className="text-[#8A8574]">From: {item.from}</p>
                  <p className="text-[#8A8574] mb-2">Subject: {item.subject}</p>
                  <p>{item.body}</p>
                </div>
                <span
                  className={`font-semibold text-[14px] flex items-center gap-1.5 ${
                    item.verdict === 'safe' ? 'text-[#0E6E5C]' : 'text-[#D6483F]'
                  }`}
                >
                  {item.verdict === 'safe' ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                  {item.verdict === 'safe' ? 'Safe' : 'High risk'}
                </span>
                <div className="absolute -top-4 -right-4">
                  <Seal
                    label={item.verdict === 'safe' ? 'Safe' : 'Scam'}
                    variant={item.verdict === 'safe' ? 'safe' : 'scam'}
                    size="sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────── PRICING ────────────────────────── */}
      <section id="pricing" className="px-6 py-16 md:py-24 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center max-w-xl mx-auto mb-16">
            <p className="text-[12px] font-bold uppercase tracking-widest text-[#0E6E5C] mb-3">Pricing</p>
            <h2
              className="text-[24px] md:text-[30px] font-normal text-[#14181A] tracking-[-0.015em] leading-[1.2]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Start free. Upgrade when you need more.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-start">
            {PRICING.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-8 flex flex-col h-full ${
                  plan.highlighted
                    ? 'bg-[#14181A] text-[#F6F4EF] shadow-xl md:-translate-y-3'
                    : 'bg-[#F6F4EF] border border-[#DEDACD] text-[#3A3A34]'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-5 right-6">
                    <Seal label="Most chosen" variant="safe" size="sm" />
                  </div>
                )}
                <h3
                  className={`text-[20px] font-medium tracking-tight ${plan.highlighted ? 'text-white' : 'text-[#14181A]'}`}
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {plan.name}
                </h3>
                <p className={`text-[13.5px] mt-1 ${plan.highlighted ? 'text-[#B9B7AC]' : 'text-[#8A8574]'}`}>
                  {plan.tagline}
                </p>
                <div className="mt-6 flex items-baseline gap-2">
                  <span
                    className={`text-[34px] font-medium ${plan.highlighted ? 'text-white' : 'text-[#14181A]'}`}
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
                  onClick={plan.name === 'Free' ? handleTryCustos : () => setFormMode('signup')}
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

      {/* ────────────────────────── TESTIMONIALS ────────────────────────── */}
      <section className="px-6 py-16 md:py-24 bg-[#F6F4EF] overflow-hidden">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center max-w-xl mx-auto mb-14">
            <p className="text-[12px] font-bold uppercase tracking-widest text-[#0E6E5C] mb-3">
              Trusted every day
            </p>
            <h2
              className="text-[24px] md:text-[30px] font-normal text-[#14181A] tracking-[-0.015em] leading-[1.2]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              People who caught it in time.
            </h2>
          </div>

          <div
            ref={testimonialsRef}
            className="carousel-scroll flex md:grid md:grid-cols-3 gap-5 md:gap-6 overflow-x-auto md:overflow-visible snap-x snap-mandatory pb-6 md:pb-0"
          >
            {TESTIMONIALS.map((t) => (
              <div
                key={t.author}
                className="shrink-0 md:shrink md:w-auto snap-center w-[85vw] sm:w-[80vw] bg-white rounded-2xl border border-[#DEDACD] p-8 flex flex-col justify-between min-h-[240px] shadow-sm"
              >
                <p className="text-[15px] text-[#3A3A34] leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <div className="border-t border-[#EAE6DB] pt-4 mt-6">
                  <p className="font-semibold text-[#14181A] text-[14px]">{t.author}</p>
                  <p className="text-[13px] text-[#8A8574]">{t.role}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex md:hidden justify-center gap-3 mt-6">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => scrollToTestimonial(i)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  i === activeTestimonial
                    ? 'bg-[#14181A] scale-110'
                    : 'bg-[#DEDACD] hover:bg-[#8A8574]'
                }`}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────── CTA ────────────────────────── */}
      <section className="px-6 py-16 md:py-24 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="bg-[#14181A] rounded-3xl px-10 py-16 md:px-16 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="text-center md:text-left max-w-lg">
              <h2
                className="text-[24px] md:text-[30px] font-normal text-white tracking-[-0.015em] leading-[1.2]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Don't get played. Get protected.
              </h2>
              <p className="mt-4 text-[16px] text-[#B9B7AC] leading-relaxed">
                Paste your first message and see the verdict for yourself — no account required.
              </p>
              <button
                onClick={handleTryCustos}
                className="mt-8 inline-flex items-center gap-2 bg-[#F6F4EF] hover:bg-white text-[#14181A] font-semibold px-7 py-3.5 rounded-full transition-colors"
              >
                Try Custos free
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <ShieldCheck className="w-28 h-28 md:w-40 md:h-40 text-[#4FCBA9]/25" strokeWidth={1.2} />
          </div>
        </div>
      </section>

      {/* ────────────────────────── FAQ ────────────────────────── */}
      <section id="faq" className="px-6 py-16 md:py-24 bg-[#F6F4EF]">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <p className="text-[12px] font-bold uppercase tracking-widest text-[#0E6E5C] mb-3">FAQ</p>
            <h2
              className="text-[24px] md:text-[30px] font-normal text-[#14181A] tracking-[-0.015em] leading-[1.2]"
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
                  className="w-full flex items-center justify-between gap-4 py-5 text-left bg-transparent hover:bg-[#EAE6DB]/40 transition-colors"
                >
                  <span className="text-[15px] font-semibold text-[#14181A]">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 text-[#8A8574] transition-transform ${
                      openFaq === i ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <div className="pb-5 text-[14.5px] text-[#5C5A4E] leading-relaxed">
                    {faq.a}
                  </div>
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

// useSearchParams() needs a Suspense boundary in the Next.js App Router
export default function Page() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}