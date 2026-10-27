import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { ScanResultProvider } from '@/context/ScanResultContext';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


const fraunces = Fraunces({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const interBody = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const SITE_NAME = "Custos AI";
const SITE_DESCRIPTION =
  "Custos AI is an AI-powered security assistant that scans emails, SMS messages, links and text for scams and phishing, and explains the risk in plain language with clear next steps.";

export const metadata: Metadata = {
 
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://https://getcustos.vercel.app"),
  title: {
    default: "Custos AI — Scam & Phishing Detection",
    template: "%s | Custos AI",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "Custos AI",
    "scam detector",
    "phishing detection",
    "email scam checker",
    "SMS scam checker",
    "link safety checker",
    "cybersecurity",
    "AI security assistant",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "Custos AI — Scam & Phishing Detection",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Custos AI — Scam & Phishing Detection",
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} ${interBody.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ScanResultProvider>
          {children}
        </ScanResultProvider>
      </body>
    </html>
  );
}