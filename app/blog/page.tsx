'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ArrowUpRight, ArrowRight } from 'lucide-react';

const FEATURED_POST = {
  title: 'The five warning signs in every phishing email, explained',
  excerpt:
    'A breakdown of the tone, structure, and technical tells that separate a scam email from a real notification — with real examples pulled from actual scans.',
  date: 'Jun 18, 2026',
  tag: 'Guides',
  readTime: '7 min read',
};

const POSTS = [
  {
    title: 'Why courier and delivery scams spike every holiday season',
    excerpt:
      'Fake "pay a customs fee" texts follow a predictable seasonal pattern. Here is what we saw across thousands of scans last quarter.',
    date: 'May 30, 2026',
    tag: 'Trends',
    readTime: '5 min read',
  },
  {
    title: 'Inside a business email compromise attempt',
    excerpt:
      'We walk through a real spoofed-vendor email, header by header, showing exactly what Custos flagged and why.',
    date: 'May 12, 2026',
    tag: 'Case study',
    readTime: '6 min read',
  },
  {
    title: 'How we measure detection accuracy',
    excerpt:
      'A look at our evaluation set, methodology, and why we would rather show our reasoning than a single confidence number.',
    date: 'Apr 22, 2026',
    tag: 'Product',
    readTime: '4 min read',
  },
  {
    title: 'What a fake job offer actually looks like',
    excerpt:
      'Recruitment scams have gotten more convincing. Here are the three details that gave one away in under a minute.',
    date: 'Apr 3, 2026',
    tag: 'Guides',
    readTime: '5 min read',
  },
  {
    title: 'Reading a spoofed domain like a security analyst',
    excerpt:
      'Homoglyphs, subdomains, and lookalike TLDs — the tricks scammers use to make a fake link look real at a glance.',
    date: 'Mar 19, 2026',
    tag: 'Guides',
    readTime: '6 min read',
  },
  {
    title: 'A quarter in scam trends: what changed and what did not',
    excerpt:
      'Parcel scams held steady, bank impersonation dipped slightly, and a new wave of fake subscription renewal emails emerged.',
    date: 'Mar 2, 2026',
    tag: 'Trends',
    readTime: '8 min read',
  },
];

const CATEGORIES = ['All', 'Guides', 'Trends', 'Case study', 'Product'];

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredPosts =
    activeCategory === 'All' ? POSTS : POSTS.filter((p) => p.tag === activeCategory);

  return (
    <main className="bg-[#F6F4EF] text-[#3A3A34]" style={{ fontFamily: 'var(--font-body)' }}>
      <Header />

      <section className="px-6 pt-16 pb-10 md:pt-24 md:pb-14">
        <div className="container mx-auto max-w-4xl">
          <p className="text-[12px] font-bold uppercase tracking-widest text-[#0E6E5C] mb-3">Blog</p>
          <h1
            className="text-[36px] md:text-[48px] font-normal text-[#14181A] tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Notes on scams, and how to spot them.
          </h1>
          <p className="mt-4 text-[16px] text-[#5C5A4E] leading-relaxed max-w-xl">
            Real examples, seasonal trends, and the reasoning behind how Custos reads a message.
          </p>
        </div>
      </section>

      {/* Featured post */}
      <section className="px-6 pb-16 bg-white">
        <div className="container mx-auto max-w-4xl">
          <a
            href="#"
            className="group block rounded-2xl border border-[#DEDACD] bg-[#F6F4EF] p-8 md:p-10 hover:border-[#0E6E5C]/40 transition-colors"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[11px] font-bold uppercase tracking-widest text-white bg-[#0E6E5C] px-2.5 py-1 rounded-full">
                Featured
              </span>
              <span className="text-[12px] text-[#8A8574]">
                {FEATURED_POST.date} · {FEATURED_POST.readTime}
              </span>
            </div>
            <h2
              className="text-[24px] md:text-[28px] font-normal text-[#14181A] tracking-tight group-hover:text-[#0E6E5C] transition-colors"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {FEATURED_POST.title}
            </h2>
            <p className="mt-3 text-[15px] text-[#5C5A4E] leading-relaxed max-w-2xl">
              {FEATURED_POST.excerpt}
            </p>
            <span className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#0E6E5C]">
              Read the post
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </a>
        </div>
      </section>

      {/* Category filter + post list */}
      <section className="px-6 py-16 md:py-24">
        <div className="container mx-auto max-w-4xl">
          <div className="flex gap-2 mb-10 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2.5 rounded-full text-[13.5px] font-semibold transition-colors ${
                  activeCategory === cat
                    ? 'bg-[#14181A] text-white'
                    : 'bg-white text-[#5C5A4E] border border-[#DEDACD] hover:border-[#0E6E5C]/40'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="divide-y divide-[#DEDACD] border-t border-b border-[#DEDACD]">
            {filteredPosts.map((post) => (
              <a
                key={post.title}
                href="#"
                className="group flex flex-col md:flex-row md:items-center justify-between gap-3 py-7 hover:bg-white/60 transition-colors px-2 -mx-2 rounded-lg"
              >
                <div className="max-w-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-[#0E6E5C]">
                      {post.tag}
                    </span>
                    <span className="text-[12px] text-[#8A8574]">
                      {post.date} · {post.readTime}
                    </span>
                  </div>
                  <h3 className="text-[18px] font-semibold text-[#14181A] group-hover:text-[#0E6E5C] transition-colors">
                    {post.title}
                  </h3>
                  <p className="mt-1.5 text-[14.5px] text-[#5C5A4E] leading-relaxed">{post.excerpt}</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#8A8574] shrink-0 group-hover:text-[#0E6E5C] transition-colors" />
              </a>
            ))}
          </div>

          {filteredPosts.length === 0 && (
            <p className="text-center text-[14.5px] text-[#8A8574] py-12">
              No posts in this category yet.
            </p>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}