'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ArrowRight, Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Features', href: '/features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Support', href: '/support' },
  { label: 'Blog', href: '/blog' },
  { label: 'Docs', href: '/docs' },
];

export function Header() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleTryCustos = () => router.push('/scanner');
  const handleSignIn = () => {
    setMobileOpen(false);
    router.push('/?signin=1');
  };

  return (
    // Not sticky: scrolls away with the page on every route
    <header className="relative z-40 w-full bg-[#F6F4EF]">
      <div className="container mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 shrink-0">
          <ShieldCheck className="w-5 h-5 text-[#0E6E5C]" strokeWidth={2.4} />
          <span
            className="text-[19px] font-semibold tracking-tight text-[#14181A]"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            Custos
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[15px] font-medium text-[#4B4A42] hover:text-[#14181A] transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={handleSignIn}
            className="text-[15px] font-semibold text-[#14181A] px-4 py-2 rounded-full hover:bg-[#EAE6DB] transition-colors"
          >
            Sign in
          </button>
          <button
            onClick={handleTryCustos}
            className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-[#F6F4EF] bg-[#14181A] px-5 py-2.5 rounded-full hover:bg-[#0E6E5C] transition-colors"
          >
            Try Custos
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="md:hidden p-2 -mr-2 text-[#14181A]"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-[#DEDACD] bg-[#F6F4EF] px-6 py-5 space-y-4">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block text-[15px] font-medium text-[#4B4A42]"
            >
              {link.label}
            </a>
          ))}
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={handleSignIn}
              className="w-full text-center text-[15px] font-semibold text-[#14181A] px-4 py-3 rounded-full border border-[#DEDACD]"
            >
              Sign in
            </button>
            <button
              onClick={handleTryCustos}
              className="w-full text-center text-[15px] font-semibold text-[#F6F4EF] bg-[#14181A] px-4 py-3 rounded-full"
            >
              Try Custos
            </button>
          </div>
        </div>
      )}
    </header>
  );
}