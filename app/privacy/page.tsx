// app/privacy/page.tsx  (self-contained)
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
  title: `Privacy Policy | ${PRODUCT}`,
  description: `How ${PRODUCT} handles your information.`,
};

const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 className="mb-3 mt-9 text-[22px] font-bold leading-snug tracking-tight text-stone-900 sm:mb-4 sm:mt-12 sm:text-[28px]">{children}</h2>
);
const H3 = ({ children }: { children: React.ReactNode }) => (
  <h3 className="mb-2.5 mt-6 text-[17px] font-bold text-stone-900 sm:mb-3 sm:mt-8 sm:text-[19px]">{children}</h3>
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

const ROWS = [
  { name: 'Supabase', use: 'Login and storing your saved scans', data: 'Account details, saved scans and chats' },
  { name: 'Groq', use: 'The AI that writes reports and answers', data: 'What you scan and what you type in the chat' },
  { name: 'Hosting provider', use: 'Running the website and servers', data: 'Request logs and IP address' },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white text-stone-800 antialiased">
      <div className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6 sm:pb-24 sm:pt-16">
        <h1 className="text-[26px] font-bold leading-tight tracking-tight text-stone-900 sm:text-[40px]">
          {PRODUCT} Privacy Policy
        </h1>
        <p className="mt-1 text-[14px] text-stone-500 sm:text-[15px]">Last Updated: {UPDATED}</p>

        <div className="mt-3 break-words text-[16px] leading-[1.75] sm:mt-4 sm:text-[17px] sm:leading-[1.8]">
          <p className="mb-0">Welcome to {PRODUCT}.</p>

          <H2>Introduction</H2>
          <P>
            {PRODUCT} checks emails, text messages, links and other messages for signs of phishing and scams. It is built and
            run by {OWNER}.
          </P>
          <P>
            This policy explains what happens to your information when you use {PRODUCT}: what we collect, why we collect it,
            who else gets to see it, and what you can do about it. We have tried to keep it short and to say only what is
            actually true.
          </P>

          <H2>What Information We Collect</H2>

          <H3>Information you give us</H3>
          <UL>
            <li>
              <B>Account details.</B> If you sign up, we get your name and email address. Your password is handled by our
              login provider, and we never see it in plain text.
            </li>
            <li>
              <B>What you scan.</B> The emails, messages, links and text you paste in, and the questions you type in the
              chat. This can include personal details about you or about other people, so please be careful what you paste.
            </li>
            <li>
              <B>Messages to us.</B> Anything you send through the feedback or bug report forms, or by email.
            </li>
          </UL>

          <H3>Information we get when you use the service</H3>
          <UL>
            <li>
              <B>Scan results and chats.</B> The risk score, the report, its title and your follow-up questions. If you are
              logged in, these are saved to your account so you can come back to them. If you are not logged in, nothing is
              saved.
            </li>
            <li>
              <B>Basic technical data.</B> Your IP address, browser type and server logs. These are handled by our hosting
              provider and help us keep the service secure, fix problems and limit abuse.
            </li>
          </UL>

          <H2>How We Use Your Information</H2>
          <UL>
            <li>To scan what you submit and write the report and chat answers.</li>
            <li>To save your history so you can reopen, rename, pin or delete your scans.</li>
            <li>To keep {PRODUCT} running, secure and free from abuse.</li>
            <li>To find and fix bugs and make the results more accurate.</li>
            <li>To reply when you get in touch.</li>
          </UL>
          <P>We do not sell your information, and there are no ads on {PRODUCT}.</P>

          <H2>How Scanning Works</H2>
          <P>It helps to know what actually happens when you press scan:</P>
          <UL>
            <li>
              <B>Pattern checks.</B> Our server looks for things scammers commonly do, like shortened links, domains that
              imitate well-known brands, requests for one-time codes and pressure to act fast.
            </li>
            <li>
              <B>Link checks.</B> If your submission contains a link, our server may visit it to see where it redirects and to
              read its security certificate. It does not download or run the page, and it will not connect to private or
              internal addresses.
            </li>
            <li>
              <B>AI analysis.</B> What you submit is sent to an AI provider, which writes the explanation you see.
            </li>
          </UL>
          <P>
            Because of that last step, please do not paste passwords, full card numbers, one-time codes or ID numbers. If the
            message you want to check contains any of these, black them out first.
          </P>

          <H2>Who Else Handles Your Data</H2>
          <P>
            We use a few outside services to run {PRODUCT}. Each one handles data only to do its job.
          </P>
          <div className="mb-4">
            {/* Desktop / tablet: table */}
            <div className="hidden overflow-hidden border border-stone-300 sm:block">
              <table className="w-full border-collapse text-left text-[15.5px]">
                <thead>
                  <tr className="border-b border-stone-300 bg-stone-50">
                    <th className="px-4 py-3 font-bold text-stone-900">Service</th>
                    <th className="px-4 py-3 font-bold text-stone-900">What it is used for</th>
                    <th className="px-4 py-3 font-bold text-stone-900">What it receives</th>
                  </tr>
                </thead>
                <tbody className="align-top">
                  {ROWS.map((r) => (
                    <tr key={r.name} className="border-b border-stone-200 last:border-b-0">
                      <td className="px-4 py-3">{r.name}</td>
                      <td className="px-4 py-3">{r.use}</td>
                      <td className="px-4 py-3">{r.data}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile: stacked cards */}
            <div className="space-y-3 sm:hidden">
              {ROWS.map((r) => (
                <div key={r.name} className="border border-stone-300 p-3.5 text-[15px] leading-relaxed">
                  <div className="font-bold text-stone-900">{r.name}</div>
                  <div className="mt-1.5">
                    <span className="font-semibold text-stone-900">Used for: </span>
                    {r.use}
                  </div>
                  <div className="mt-1">
                    <span className="font-semibold text-stone-900">Receives: </span>
                    {r.data}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <P>
            We may also share information if the law requires it, or if it is needed to protect users or the service. We do
            not use advertising networks or third-party analytics right now. If that ever changes, we will update this page
            first.
          </P>

          <H2>How Long We Keep Your Data</H2>
          <P>
            Saved scans and chats stay in your account until you delete them. When you delete a scan it disappears from your
            history, but it can stay in our database for a little while before it is wiped for good. If you want something
            erased straight away, or want your whole account removed, email <Mail /> and we will take care of it.
          </P>

          <H2>Cookies</H2>
          <P>
            We only use the cookies and browser storage needed to keep you logged in and remember simple settings. We do not
            use them to track you or to show ads.
          </P>

          <H2>Your Rights and Choices</H2>
          <UL>
            <li>You can use {PRODUCT} without an account. In that case nothing is saved.</li>
            <li>You can delete any saved scan from inside the app.</li>
            <li>
              You can ask to see, correct or delete the personal information we hold about you by emailing <Mail />. We will
              get back to you as soon as we can.
            </li>
          </UL>

          <H2>Security</H2>
          <P>
            We protect your information with encrypted connections (HTTPS), a managed login service and limits on how often
            the service can be called. We do our best, but no online service is perfectly secure, so we cannot promise
            absolute safety. A strong, unique password goes a long way.
          </P>

          <H2>Children</H2>
          <P>
            {PRODUCT} is not meant for children under 13, and we do not knowingly collect their information. If you think a
            child has given us their details, email us and we will delete them.
          </P>

          <H2>Where Your Data Goes</H2>
          <P>
            The services we use may process data in other countries. By using {PRODUCT}, you understand that your information
            may be handled outside the country where you live.
          </P>

          <H2>Changes to This Policy</H2>
          <P>
            We may update this policy as {PRODUCT} grows. When we do, we will change the "Last Updated" date at the top, and
            if the change is a big one we will let you know in the app.
          </P>

          <H2>Contact Us</H2>
          <P>
            Questions about your privacy or your data? Write to us at <Mail />.
          </P>
        </div>

        <div className="mt-12 border-t border-stone-200 pt-5 text-[14px] text-stone-500 sm:mt-14 sm:pt-6">
          <Link href="/terms" className="hover:text-stone-900">Terms of Service</Link>
          <span className="mx-3">·</span>
          <Link href="/privacy" className="font-medium text-stone-900">Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
}