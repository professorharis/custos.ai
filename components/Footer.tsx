'use client';

import React, { useState } from 'react';
import { ChevronDown, ShieldCheck } from 'lucide-react';

const footerData = [
  {
    title: 'PRODUCT',
    links: [
      { label: 'Home', href: '/' },
      { label: 'Features', href: '/features' },

      { label: 'Pricing', href: '/pricing' },
      { label: 'FAQ', href: '/faq' },
    ],
  },
  {
    title: 'SECURITY',
    links: [
      { label: 'Report a Scam', href: '/report-scam' },
      { label: 'Fraud Protection', href: '/fraud-protection' },
      { label: 'Trust & Safety', href: '/trust-safety' },
    ],
  },
  {
    title: 'LEGAL',
    links: [
      { label: 'Privacy policy', href: '/privacy' },
      { label: 'Terms & conditions', href: '/terms' },
      { label: 'Cookies', href: '/cookies' },
      { label: 'Compliance', href: '/compliance' },
    ],
  },
  {
    title: 'COMPANY',
    links: [
      { label: 'About us', href: '/about' },
      { label: 'Support', href: '/support' },
      { label: 'Blog', href: '/blog' },
      { label: 'Documentation', href: '/docs' },
    ],
  },
];

// Mobile accordion
const FooterSectionMobile: React.FC<{
  title: string;
  links: { label: string; href: string }[];
}> = ({ title, links }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="py-1">
      <button
        className="w-full flex items-center justify-between py-3 text-gray-200 font-semibold text-sm tracking-wide"
        onClick={() => setOpen(!open)}
      >
        <span>{title}</span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          open ? 'grid-rows-[1fr] opacity-100 pb-3' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden flex flex-col space-y-2">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-gray-400 hover:text-white text-[14px] transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#1a1c20] text-gray-100 font-sans antialiased border-t border-gray-800">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8 py-16">
        {/* Logo + tagline */}
        <div className="mb-12 md:mb-10 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
          <a href="/" className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#0E6E5C]" strokeWidth={2.2} />
            <span
              className="text-2xl font-semibold tracking-tight text-white"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Custos
            </span>
          </a>
          <p className="text-gray-400 text-sm md:text-[15px] max-w-md md:ml-6">
            Your AI‑powered scam detection companion — because trust should be verified, not assumed.
          </p>
        </div>

        {/* Desktop grid */}
        <div className="hidden md:grid grid-cols-4 gap-8 max-w-[920px] pb-12">
          {footerData.map((section) => (
            <div key={section.title} className="space-y-4">
              <h4 className="font-bold text-white text-[15px] tracking-wider uppercase">
                {section.title}
              </h4>
              <div className="space-y-3 text-[14px]">
                {section.links.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="block text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Mobile accordion */}
        <div className="md:hidden block pb-6">
          <div className="flex flex-col divide-y divide-gray-800">
            {footerData.map((section) => (
              <FooterSectionMobile
                key={section.title}
                title={section.title}
                links={section.links}
              />
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 w-full my-6 md:my-8" />

        {/* Bottom bar – no language button */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="text-[14px] text-gray-400">
            <span>© Custos AI 2026</span>
            <span className="mx-2 text-gray-600">—</span>
            <span className="font-medium text-gray-200">Your AI Scam Detector</span>
          </div>
        
        </div>
      </div>
    </footer>
  );
};