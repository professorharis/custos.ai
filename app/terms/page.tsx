// app/terms/page.tsx  (self-contained)
import type { Metadata } from 'next';
import Link from 'next/link';
import React from 'react';

// ── EDIT THESE ───────────────────────────────────────────────────────────
const PRODUCT = 'Custos AI';
const OWNER = 'Haris';
const EMAIL = 'professorharis804@gmail.com';
const UPDATED = 'October 27, 2026';
// ─────────────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: `Terms of Service | ${PRODUCT}`,
  description: `The terms for using ${PRODUCT}.`,
};

const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 className="mb-3 mt-9 text-[22px] font-bold leading-snug tracking-tight text-stone-900 sm:mb-4 sm:mt-12 sm:text-[28px]">{children}</h2>
);
const P = ({ children }: { children: React.ReactNode }) => <p className="mb-4">{children}</p>;
const UL = ({ children }: { children: React.ReactNode }) => (
  <ul className="mb-4 list-disc space-y-2.5 pl-5 sm:pl-6">{children}</ul>
);
const B = ({ children }: { children: React.ReactNode }) => (
  <strong className="font-bold text-stone-900">{children}</strong>
);
const Mail = () => (
  <a className="text-blue-600 underline underline-offset-2 hover:text-blue-800" href={`mailto:${EMAIL}`}>
    {EMAIL}
  </a>
);

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white text-stone-800 antialiased">
      <div className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6 sm:pb-24 sm:pt-16">
        <h1 className="text-[26px] font-bold leading-tight tracking-tight text-stone-900 sm:text-[40px]">
          {PRODUCT} Terms of Service
        </h1>
        <p className="mt-1 text-[14px] text-stone-500 sm:text-[15px]">Last Updated: {UPDATED}</p>

        <div className="mt-3 break-words text-[16px] leading-[1.75] sm:mt-4 sm:text-[17px] sm:leading-[1.8]">
          <p className="mb-0">Welcome to {PRODUCT}.</p>

          <H2>Introduction</H2>
          <P>
            {PRODUCT} checks emails, text messages, links and other messages for signs of phishing and scams. It is built and
            run by {OWNER}. These terms are the ground rules for using it.
          </P>
          <P>
            By using {PRODUCT}, you agree to these terms and to our{' '}
            <Link href="/privacy" className="text-blue-600 underline underline-offset-2 hover:text-blue-800">
              Privacy Policy
            </Link>
            . If you do not agree with them, please do not use the service.
          </P>

          <H2>What {PRODUCT} Does</H2>
          <P>
            You paste in an email, message, link or text, and {PRODUCT} gives you a risk score with a written explanation.
            You can also ask security questions in the chat. If you submit a link, our server may visit it to see where it
            redirects and to check its security certificate. It does not download or run the page.
          </P>

          <H2>Results Can Be Wrong</H2>
          <P>
            <B>Please take this seriously.</B> The reports and chat answers come from automated checks and an AI model. They
            can be incomplete, out of date or just plain wrong. A low risk score does not mean something is safe, and a high
            risk score does not mean it is definitely a scam.
          </P>
          <UL>
            <li>Treat the result as a second opinion, not the final word.</li>
            <li>
              If a message asks for money, codes or personal details, confirm it through an official channel you already
              trust, like the number on the back of your bank card or the company's own app.
            </li>
            <li>Never share an OTP, PIN or card detail because a message told you to.</li>
          </UL>
          <P>
            {PRODUCT} is not legal, financial or professional security advice. It does not replace antivirus software, your
            bank's fraud team or the police.
          </P>

          <H2>Your Account</H2>
          <UL>
            <li>Give us accurate details and keep your login private.</li>
            <li>
              You are responsible for what happens under your account. If you think someone else got in, let us know.
            </li>
            <li>You need to be at least 13 years old to use {PRODUCT}.</li>
          </UL>

          <H2>What You Must Not Do</H2>
          <UL>
            <li>Break the law or violate other people's rights.</li>
            <li>Use {PRODUCT} to make, improve or test scams, phishing pages or malware.</li>
            <li>
              Use the link checker to probe, attack or overload any website, internal network or system that is not yours.
            </li>
            <li>Submit someone else's private information without a good reason and the right to do so.</li>
            <li>
              Get around usage limits, scrape the service with bots, or try to pull out its prompts, code or models.
            </li>
          </UL>
          <P>If these rules are broken, we may limit or block access.</P>

          <H2>Your Content</H2>
          <P>
            What you submit stays yours. By submitting it, you let us process it, save it to your history if you are logged
            in, and pass it to the services listed in our Privacy Policy, all so {PRODUCT} can work for you. Please only
            submit things you have the right to share.
          </P>

          <H2>Free Service, No Promises</H2>
          <P>
            {PRODUCT} is free, and it is provided "as is". It can be slow, it can have bugs, and it can go offline. We may
            change it, add limits or shut parts of it down at any time, and we will try to give notice when we can. We do not
            promise that results will be accurate or that the service will always be available.
          </P>

          <H2>Our Responsibility</H2>
          <P>
            As far as the law allows, we are not responsible for losses that come from using {PRODUCT} or trusting its
            results. That includes a scam we failed to catch, a safe message we flagged by mistake, lost money or data, and
            anything on third-party websites you scan or visit. None of this takes away rights you have under the law that
            cannot be waived.
          </P>

          <H2>Third-Party Services and Links</H2>
          <P>
            {PRODUCT} depends on outside services for login, hosting and AI. The links you scan lead to websites we do not
            control, and we are not responsible for what is on them.
          </P>

          <H2>Ownership</H2>
          <P>
            The design, text, logo and code of {PRODUCT} belong to {OWNER}. Please do not copy or resell them, or use the name
            and logo, without asking first.
          </P>

          <H2>Ending Your Use</H2>
          <P>
            You can stop using {PRODUCT} and delete your scans whenever you like. We may suspend or remove access if these
            terms are broken, or if we need to protect the service or other users.
          </P>

          <H2>Governing Law</H2>
          <P>These terms are governed by the laws of Pakistan.</P>

          <H2>Changes to These Terms</H2>
          <P>
            We may update these terms as {PRODUCT} grows. When we do, we will change the "Last Updated" date at the top. If
            you keep using {PRODUCT} after a change, that means you accept the new terms.
          </P>

          <H2>Contact Us</H2>
          <P>
            Questions about these terms? Write to us at <Mail />.
          </P>
        </div>

        <div className="mt-12 border-t border-stone-200 pt-5 text-[14px] text-stone-500 sm:mt-14 sm:pt-6">
          <Link href="/terms" className="font-medium text-stone-900">Terms of Service</Link>
          <span className="mx-3">·</span>
          <Link href="/privacy" className="hover:text-stone-900">Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
}