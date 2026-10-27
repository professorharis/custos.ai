import React from 'react';
import {
  FileText,
  Globe,
  Link2,
  Mail,
  Smartphone,
} from 'lucide-react';
import type { ScamResult } from '@/lib/types';

// ─────────────────────────────────────────────────────────────────────────
// Fonts
// ─────────────────────────────────────────────────────────────────────────

export const FONT_HEADING = 'var(--font-heading)';
export const FONT_BODY = 'var(--font-body)';

// Script-specific fonts used for follow-up messages / typed input, so
// Urdu/Arabic and Hindi content renders in a proper native typeface
// instead of being forced into the Latin Inter font.
export const FONT_URDU = "'Noto Sans Urdu', 'Arial', sans-serif";
export const FONT_DEVANAGARI = "'Noto Sans Devanagari', 'Inter', ui-sans-serif, system-ui, sans-serif";

const ARABIC_URDU_SCRIPT_REGEX = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;
const DEVANAGARI_SCRIPT_REGEX = /[\u0900-\u097F]/;

// Picks a proper font (+ text direction) based on the script actually
// used in the message.
export function getMessageTypography(text: string): { fontFamily: string; dir: 'rtl' | 'ltr' } {
  if (ARABIC_URDU_SCRIPT_REGEX.test(text)) {
    return { fontFamily: FONT_URDU, dir: 'rtl' };
  }
  if (DEVANAGARI_SCRIPT_REGEX.test(text)) {
    return { fontFamily: FONT_DEVANAGARI, dir: 'ltr' };
  }
  return { fontFamily: FONT_BODY, dir: 'ltr' };
}

// ─────────────────────────────────────────────────────────────────────────
// Shared types
// ─────────────────────────────────────────────────────────────────────────

export type InputType = 'text' | 'sms' | 'email' | 'url';

export interface KeywordFinding {
  heading: string;
  content: string;
}

export type ScamResultWithFindings = ScamResult & {
  findings?: KeywordFinding[];
  threatType?: string;
  attemptLabel?: string;
  status?: string;
  cvss?: string;
  recommendation?: string;
};

export interface SidebarNavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
}

export interface HistoryEntry {
  id: string;
  label: string;
  timestamp: string;
  pinned?: boolean;
  raw?: any;
}

// A single turn in the "ask about this report" / general chat thread.
export interface FollowUpMessage {
  role: 'user' | 'assistant';
  content: string;
  // Present on assistant turns that carry suggestion chips.
  suggestions?: string[];
}

// ─────────────────────────────────────────────────────────────────────────
// Config / static data
// ─────────────────────────────────────────────────────────────────────────

// NOTE: the UI no longer shows this checklist (replaced by the AI-written
// "Thinking…" block). Kept exported so any other file importing it
// doesn't break.
export const CHECKLIST_STEPS: Record<InputType, string[]> = {
  email: [
    'Detecting content type',
    'Extracting URLs and email addresses',
    'Checking phishing indicators',
    'Analysing language and intent',
    'Evaluating sender authenticity',
    'Calculating overall risk',
  ],
  sms: [
    'Detecting content type',
    'Extracting phone numbers and links',
    'Checking phishing indicators',
    'Analysing language and intent',
    'Evaluating sender ID',
    'Calculating overall risk',
  ],
  url: [
    'Detecting content type',
    'Parsing domain and SSL details',
    'Checking redirect chains',
    'Analysing hosting reputation',
    'Evaluating phishing indicators',
    'Calculating overall risk',
  ],
  text: [
    'Detecting content type',
    'Extracting URLs and contacts',
    'Checking scam keywords',
    'Analysing language and intent',
    'Evaluating urgency patterns',
    'Calculating overall risk',
  ],
};

// Used when the AI-written steps are not available (slow / failed request),
// so the scan screen always shows real-looking steps for the content type.
export const FALLBACK_SCAN_STEPS: Record<InputType, string[]> = {
  email: ['Analyzing email', 'Checking sender details', 'Verifying links', 'Finding grammar mistakes', 'Checking urgency tactics'],
  sms: ['Reading the message', 'Checking sender ID', 'Verifying links and numbers', 'Checking urgency tactics'],
  url: ['Parsing the domain', 'Verifying SSL certificate', 'Checking redirects', 'Checking phishing patterns'],
  text: ['Reading the message', 'Checking scam patterns', 'Finding fake claims', 'Checking urgency tactics'],
};

// Full list shown while a scan runs:
//   "Analyzing…"  ->  AI-written steps for THIS content (or fallbacks)  ->  "Generating report…"
export function buildScanSteps(aiSteps: string[], type: InputType): string[] {
  const middle = aiSteps.length > 0 ? aiSteps : (FALLBACK_SCAN_STEPS[type] ?? FALLBACK_SCAN_STEPS.text);
  return ['Analyzing', ...middle, 'Generating report'];
}

// Short ghost-typing samples (less text on the home screen).
export const SAMPLE_SENTENCES: Record<InputType, string> = {
  text: 'Paste a message…',
  sms: 'Paste an SMS…',
  email: 'Paste an email…',
  url: 'Paste a link…',
};

export const INPUT_PLACEHOLDER = 'Paste or ask anything…';

// Shown once a scan result exists (typo "anaylsis" fixed).
export const FOLLOWUP_PLACEHOLDER = 'Ask about this analysis';

export const QUICK_ACTIONS = [
  { id: 'text' as const, label: 'Analyze text', icon: FileText },
  { id: 'sms' as const, label: 'Check SMS', icon: Smartphone },
  { id: 'email' as const, label: 'Scan email', icon: Mail },
  { id: 'url' as const, label: 'Verify link', icon: Link2 },
];

export const TYPE_ICON: Record<InputType, React.ComponentType<{ className?: string }>> = {
  text: FileText,
  sms: Smartphone,
  email: Mail,
  url: Globe,
};

export const TYPE_HEADER_LABEL: Record<InputType, string> = {
  text: 'Text Scan Analysis',
  sms: 'SMS Scan Analysis',
  email: 'Email Scan Analysis',
  url: 'URL Scan Analysis',
};

export const NEW_CONTENT_TYPE_LABEL: Record<InputType, string> = {
  text: 'text message',
  sms: 'SMS message',
  email: 'email',
  url: 'URL',
};

export const RECOMMENDATION_HEADINGS = [
  'Recommended Actions',
  'Action to Take',
  'Incident Response',
  'Next Steps',
  'What to Do Now',
];

// ─────────────────────────────────────────────────────────────────────────
// Colour tokens
// ─────────────────────────────────────────────────────────────────────────

export const SIDEBAR_BG = 'bg-[#FCFCFC]';
export const MAIN_AREA_BG = 'bg-[#F3F3F3]';
export const PAGE_BASE_BG = 'bg-[#FFFFFF]';

// ─────────────────────────────────────────────────────────────────────────
// Small pure helpers
// ─────────────────────────────────────────────────────────────────────────

export function pickRecommendationHeading(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return RECOMMENDATION_HEADINGS[hash % RECOMMENDATION_HEADINGS.length];
}

export function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export function formatRecommendation(text: string) {
  const sentences = text.split('.').filter((s) => s.trim().length > 0);
  if (sentences.length <= 1) return [text];
  return sentences.map((s) => s.trim() + '.');
}

// ─────────────────────────────────────────────────────────────────────────
// Follow-up vs. new-scan vs. general-chat detection
//
//   (a) a follow-up question about the existing report,
//   (b) the exact same content resubmitted (silent re-scan),
//   (c) genuinely new scannable content -> "Start a new scan?" popup,
//   (d) a greeting / general question with NO scannable content -> plain
//       chat reply, no scan steps at all (see isGeneralQuestion).
// These are heuristics and can be tuned further.
// ─────────────────────────────────────────────────────────────────────────

const CONTAINS_URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+)/i;
const EMAIL_ADDRESS_REGEX = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const EMAIL_MARKER_REGEX = /(subject:|from:|dear [a-z]+,|regards,|sincerely,|to whom it may concern)/i;
const SUSPICIOUS_MESSAGE_REGEX = /(click here|verify your account|limited time|urgent(ly)?|congratulations|you('|’)ve won|winner|otp|one[- ]time (code|password)|account (has been|will be) (suspended|locked)|reset your password|confirm your (details|identity|payment))/i;

const GREETING_REGEX = /^(hi|hello|hey|salam|salaam|assalam[\w\s-]*|aoa|good (morning|afternoon|evening)|thanks|thank you|shukriya)\b/i;

const FOLLOWUP_TRIGGER_STARTS = [
  'why', 'what', 'how', 'explain', 'summarize', 'summarise', 'translate',
  'is this', 'can you', 'could you', 'does this', 'do you', 'tell me',
  'give me', 'show me', 'describe', 'elaborate', 'who', 'when', 'where',
  // common romanized Urdu/Hindi follow-up openers
  'kyun', 'kyu', 'kaise', 'samjha', 'samjhao', 'batao', 'matlab', 'tarjuma',
  'yeh kyun', 'ye kyun',
];

export function normalizeForCompare(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function isSameContent(a: string, b: string): boolean {
  if (!a || !b) return false;
  return normalizeForCompare(a) === normalizeForCompare(b);
}

export function looksLikeFollowUpQuestion(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (trimmed.endsWith('?')) return true;
  const lower = trimmed.toLowerCase();
  return FOLLOWUP_TRIGGER_STARTS.some((w) => lower.startsWith(w));
}

// True = this is a greeting / general question, NOT scannable content.
// The caller should send it straight to the chat endpoint (no scan steps).
export function isGeneralQuestion(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (CONTAINS_URL_REGEX.test(t)) return false;
  if (EMAIL_MARKER_REGEX.test(t) || SUSPICIOUS_MESSAGE_REGEX.test(t)) return false;
  if (t.length > 300 || /\n/.test(t)) return false;
  return GREETING_REGEX.test(t) || looksLikeFollowUpQuestion(t);
}

export function looksLikeNewScanContent(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 15) return false;
  if (looksLikeFollowUpQuestion(trimmed)) return false;

  // A short message that's basically just a bare URL.
  if (CONTAINS_URL_REGEX.test(trimmed) && trimmed.split(/\s+/).length <= 6) return true;

  const hasEmailMarkers = EMAIL_MARKER_REGEX.test(trimmed);
  const hasEmailAddress = EMAIL_ADDRESS_REGEX.test(trimmed);
  const looksScammy = SUSPICIOUS_MESSAGE_REGEX.test(trimmed);
  const isMultiline = /\n/.test(trimmed);

  if (trimmed.length > 60 && (hasEmailMarkers || (hasEmailAddress && isMultiline) || looksScammy || isMultiline)) {
    return true;
  }

  return false;
}

// Rough auto-detection of scan type for freshly-pasted content.
export function detectInputType(text: string): InputType {
  const trimmed = text.trim();
  const isBareUrl = CONTAINS_URL_REGEX.test(trimmed) && trimmed.split(/\s+/).length <= 6;
  if (isBareUrl) return 'url';

  const hasEmailMarkers = EMAIL_MARKER_REGEX.test(trimmed);
  const hasEmailAddress = EMAIL_ADDRESS_REGEX.test(trimmed);
  if (hasEmailMarkers || (hasEmailAddress && trimmed.length > 150)) return 'email';

  if (trimmed.length <= 200) return 'sms';
  return 'text';
}