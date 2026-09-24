import {
  Mail,
  AlertTriangle,
  Smartphone,
  Link2,
  FileText,
  Building,
  Zap,
  Key,
  UserCog,
  Shield,
} from 'lucide-react';
import type { FaqItem, FeatureItem, TechniqueItem, FooterSection } from './types';

// ─── FAQ Data ──────────────────────────────────────────────
export const faqData: Record<string, FaqItem[]> = {
  General: [
    {
      question: 'Why should I use an AI-powered scam detector for my messages?',
      answer:
        'Traditional spam filters rely on keyword lists and known bad senders. Scammers today use dynamic text, social engineering, and targeted impersonation that easily bypass these filters. Our AI analyses the semantic meaning, intent, and complex fraud patterns in any text, SMS, or email you paste into our web tool. It catches sophisticated scams that others miss and learns continuously from new threats.',
    },
    {
      question: 'How does the AI scam detection work?',
      answer:
        'Our AI is trained on millions of confirmed scam messages. When you paste a message into our scanner, it examines the text, checks for suspicious links, evaluates sender patterns, and detects urgency or impersonation cues. You receive a risk score (0–100%), a detailed explanation, and actionable safety tips – all in seconds, directly in your browser.',
    },
    {
      question: 'What types of messages can I scan?',
      answer:
        'You can paste any text-based content: a single email (full body and subject), an SMS, a direct message from social media, or even a URL. The tool will analyse the content and provide a risk assessment. There is no need to upload files or set up integrations – just copy, paste, and analyse.',
    },
    {
      question: 'How does pattern matching and context analysis work?',
      answer:
        'Our AI draws from a massive database of scam indicators. It identifies typical phishing language (urgency, threats, fake authority), mismatched sender details, suspicious URLs (even shortened or obfuscated), and social engineering tactics. The model considers the entire context of the message – not just isolated keywords – to give a more accurate assessment.',
    },
    {
      question: 'Is there real-time protection available?',
      answer:
        'Currently we offer a web‑based analysis tool where you manually paste messages for instant scanning. No browser extension or real‑time integration is required – you simply use our secure interface whenever you receive a suspicious message. This keeps your privacy intact and works on any device.',
    },
    {
      question: 'Can I try it for free, and is it accurate?',
      answer:
        'Yes, the tool is free to use for individual message scanning. Our AI is highly accurate, with over 99% detection rates and very low false positives, validated by independent tests. However, as with any automated system, we recommend using it as one layer of defence and always staying vigilant.',
    },
  ],
  Technical: [
    {
      question: 'How does the AI model get updated?',
      answer:
        'We continuously retrain our models with newly discovered scam patterns. Updates are rolled out weekly to ensure you benefit from the latest protection without any action on your part.',
    },
    {
      question: 'What is the accuracy rate?',
      answer:
        'Our current model achieves over 99.2% detection rate with less than 0.5% false positives, validated by independent security audits.',
    },
  ],
  Billing: [
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, PayPal, and wire transfers for enterprise plans.',
    },
    {
      question: 'Is there a free trial?',
      answer: 'Yes, you can use the web scanner free of charge for individual messages – no credit card required.',
    },
  ],
  Support: [
    {
      question: 'How do I contact support?',
      answer: 'You can reach us 24/7 via live chat on our website or email support@aiscamguard.com.',
    },
  ],
};

// ─── Features ──────────────────────────────────────────────
export const features: FeatureItem[] = [
  {
    title: 'Email Scam Detection',
    text: 'Paste an email (subject and body) to analyse for spoofing, phishing, and business email compromise (BEC) attempts. Get a detailed risk breakdown instantly.',
    icon: Mail,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
  },
  {
    title: 'SMS & Smishing Analysis',
    text: 'Copy and paste any SMS text to detect fake bank alerts, delivery scams, urgency tactics, and malicious short links – all in your browser.',
    icon: Smartphone,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  },
  {
    title: 'URL & Link Reputation',
    text: 'Enter any suspicious link to check its reputation. Our system evaluates domain age, SSL validity, redirect chains, and known malicious patterns – giving you a trust score.',
    icon: Link2,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
  },
  {
    title: 'Text & Message Fraud',
    text: 'Paste any text message – from WhatsApp, direct messages, or plain text – and our AI will uncover social engineering, impersonation, and fraudulent intent with a clear explanation.',
    icon: FileText,
    color: 'text-orange-600 bg-orange-50 border-orange-200',
  },
];

// ─── Techniques ────────────────────────────────────────────
export const techniques: TechniqueItem[] = [
  {
    title: 'Phishing Emails',
    description: 'Scammers impersonate trusted entities (banks, government) to steal credentials or personal data.',
    icon: Mail,
  },
  {
    title: 'Smishing (SMS) Attacks',
    description: 'Fraudulent text messages with malicious links or urgent requests to trick victims into revealing info.',
    icon: AlertTriangle,
  },
  {
    title: 'Social Engineering',
    description: 'Psychological manipulation using urgency, authority, or fake personas to bypass security.',
    icon: UserCog,
  },
];

// ─── Testimonials ──────────────────────────────────────────
export const testimonials = [
  {
    text: 'We’ve been using this tool to quickly analyse suspicious messages before taking any action. It has drastically reduced successful phishing attempts in our organisation by giving our team immediate, clear risk assessments.',
    author: 'Alice Cooper',
    photo: 'https://randomuser.me/api/portraits/women/45.jpg',
    company: 'TechGuard Inc.',
  },
  {
    text: 'Saved us from a major business email compromise that could have cost millions. The contextual analysis is incredibly accurate.',
    author: 'Bob Vance',
    photo: 'https://randomuser.me/api/portraits/men/32.jpg',
    company: 'SecureNet Solutions',
  },
  {
    text: 'The AI scam detector caught a sophisticated smishing attempt targeting our employees within seconds. Essential protection.',
    author: 'Carol Danvers',
    photo: 'https://randomuser.me/api/portraits/women/68.jpg',
    company: 'Apex Cyber Security',
  },
];