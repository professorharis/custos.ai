'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowUp, Pin, RotateCcw, Share2, Square } from 'lucide-react';
import type { ScamResult } from '@/lib/types';
import { useScanResult } from '@/context/ScanResultContext';
import { getRiskLevelLabel } from '@/lib/scannerHelpers';
import { supabase } from '@/lib/supabase';
import { generatePDFReport } from '@/lib/generatePdfReport';
import { buildReportDocumentData } from '@/components/ReportDocument';
import type { AvatarModalType } from '@/components/dashboard/AvatarMenu';
import { useScanHistory } from '@/hooks/useScanHistory';
import { ProfileModal } from '@/components/dashboard/modals/ProfileModal';
import { UsageModal } from '@/components/dashboard/modals/UsageModal';
import { SettingsModal } from '@/components/dashboard/modals/SettingsModal';
import { FeedbackModal } from '@/components/dashboard/modals/FeedbackModal';
import { BugReportModal } from '@/components/dashboard/modals/BugReportModal';
import { ShortcutsModal } from '@/components/dashboard/modals/ShortcutsModal';
import { ErrorCard, ErrorBanner } from '@/components/ErrorCard';
import { extractErrorCode, type ErrorCode } from '@/lib/errorTypes';

import { Sidebar } from './Sidebar';
import { ReportPanel } from './ReportPanel';
import {
  AiResultMessage,
  ChatHeaderMenu,
  DeleteConfirmModal,
  FollowUpAiBubble,
  FollowUpUserBubble,
  HamburgerIcon,
  MobileChatHeaderMenu,
  NewChatButton,
  NewScanConfirmModal,
  ThinkingBlock,
  UserMessage,
} from './ChatArea';
import {
  FONT_BODY,
  FONT_HEADING,
  FOLLOWUP_PLACEHOLDER,
  INPUT_PLACEHOLDER,
  NEW_CONTENT_TYPE_LABEL,
  QUICK_ACTIONS,
  SAMPLE_SENTENCES,
  TYPE_HEADER_LABEL,
  getMessageTypography,
  isSameContent,
  type FollowUpMessage,
  type InputType,
  type ScamResultWithFindings,
} from './types';

// ── Real logo (put your file in public/) ─────────────────────────────────
const LOGO_SRC = '/logo.png';
const LOGO_ALT = 'Custos AI';

type LiveFollowUpMessage = FollowUpMessage & { streaming?: boolean };

const REDIRECT_SUGGESTIONS = [
  "🛡 Explain this risk score",
  "📧 How does email phishing work?",
  "🌐 Is this website safe?",
  "💬 How can I recognize scam messages?",
];

interface ScannerProps {
  onScan?: (data: {
    input_content: string;
    scan_type: InputType;
    is_scam: boolean;
    risk_score: number;
    risk_level: string;
    explanation: string;
    safety_tips: string[];
  }) => void;
}

const PAGE_WASH_BG = 'bg-[#F8F8F8]';
const MAIN_COLUMN_BG = 'bg-[#FCFCFC]';
const AUTO_SCROLL_THRESHOLD_PX = 120;
const HISTORY_SWITCH_SKELETON_MS = 380;
const NEW_SCAN_HOME_FLASH_MS = 220;
const REQUEST_TIMEOUT_MS = 70000;
const MIN_SCAN_DURATION_MS = 3500;
const THINKING_STEP_MS = 1500; // one thinking step is shown for ~1.5s
const THINKING_MAX_MS = 9500;

// How many scans the sidebar loads. (Was 8 → the oldest item disappeared
// every time a new scan was added.)
const HISTORY_LIMIT = 50;

function buildScanDetails(
  result: ScamResultWithFindings | null,
  followUps: FollowUpMessage[],
  scanType?: InputType,
  preMessages: FollowUpMessage[] = []
) {
  const r = result as any;
  return {
    explanation: result?.explanation ?? '',
    safetyTips: result?.safetyTips ?? [],
    scanId: result?.scanId,
    // saved so a reopened chat shows the SAME style (SMS stays SMS, email stays email)
    scanType: scanType ?? null,
    findings: result?.findings ?? [],
    recommendation: result?.recommendation ?? null,
    // extra fields so a reopened chat shows the same result
    attemptLabel: result?.attemptLabel ?? null,
    threatType: result?.threatType ?? null,
    indicators: r?.indicators ?? [],
    metaRows: r?.metaRows ?? [],
    targetBrand: r?.targetBrand ?? null,
    status: r?.status ?? null,
    cvss: r?.cvss ?? null,
    reportTitle: r?.reportTitle ?? null,
    // general chat that happened BEFORE the scan in the same conversation
    preMessages: preMessages.map((f) => ({ role: f.role, content: f.content, suggestions: f.suggestions })),
    followUps: followUps.map((f) => ({ role: f.role, content: f.content, suggestions: f.suggestions })),
  };
}

const TITLE_TYPE_LABEL: Record<InputType, string> = {
  url: 'Link',
  email: 'Email',
  sms: 'SMS',
  text: 'Message',
};

const KNOWN_BRANDS = [
  'Easypaisa', 'JazzCash', 'Jazz', 'Zong', 'Telenor', 'Ufone', 'PayPal', 'Amazon', 'Netflix', 'Apple',
  'Google', 'Microsoft', 'Facebook', 'Instagram', 'WhatsApp', 'DHL', 'FedEx', 'Daraz', 'Meezan',
  'Alfalah', 'NADRA', 'FBR', 'BISP', 'Binance', 'Telegram', 'TikTok',
];
const CAPS_STOPLIST = new Set([
  'SMS', 'OTP', 'URL', 'PIN', 'CNIC', 'ATM', 'USD', 'PKR', 'ASAP', 'FREE', 'NOW', 'URGENT', 'ALERT',
  'DEAR', 'HTTP', 'HTTPS', 'WWW', 'COM', 'PDF', 'KYC', 'ID', 'AM', 'PM', 'RS', 'NOTICE', 'WARNING',
]);

/** Brand / organisation the message is about, if it is easy to spot. */
function guessBrand(text: string): string {
  const lower = text.toLowerCase();
  const known = KNOWN_BRANDS.find((b) => new RegExp(`\\b${b.toLowerCase()}\\b`).test(lower));
  if (known) return known;
  const caps = (text.match(/\b[A-Z]{2,6}\b/g) ?? []).find((w) => !CAPS_STOPLIST.has(w));
  return caps ?? '';
}

// Short, clean titles like "HBL SMS Analysis" / "PayPal Email Analysis" / "example.com Link Analysis".
// (The AI title from /api/generate-title replaces this a moment later.)
function deriveFallbackTitle(content: string, type: InputType): string {
  const trimmed = (content || '').trim();
  const label = TITLE_TYPE_LABEL[type];
  if (!trimmed) return TYPE_HEADER_LABEL[type];

  if (type === 'url') {
    const match = trimmed.match(/(?:https?:\/\/|www\.)[^\s]+|\b(?:[a-z0-9-]+\.)+[a-z]{2,}[^\s]*/i)?.[0] ?? trimmed;
    try {
      const u = new URL(match.startsWith('http') ? match : `https://${match}`);
      return `${u.hostname.replace(/^www\./, '')} Link Analysis`;
    } catch {
      return 'Link Analysis';
    }
  }

  if (type === 'email') {
    const from = trimmed.match(/^\s*from\s*:\s*(.+)$/im)?.[1]?.trim() ?? '';
    const name = from.replace(/<.*>/, '').replace(/["']/g, '').trim();
    const domain = from.match(/@([a-z0-9.-]+\.[a-z]{2,})/i)?.[1]?.replace(/^(mail|email|info|noreply)\./i, '') ?? '';
    const who = (name && !/@/.test(name) ? name : guessBrand(trimmed) || domain).slice(0, 26).trim();
    return who ? `${who} Email Analysis` : 'Email Analysis';
  }

  const brand = guessBrand(trimmed);
  return brand ? `${brand} ${label} Analysis` : `${label} Analysis`;
}

// ── Random greeting builder (picks once per mount) ───────────────────────
function buildGreeting(rawName: string): string {
  const h = new Date().getHours();
  const dayPart =
    h >= 5 && h < 12
      ? 'Morning'
      : h >= 12 && h < 17
      ? 'Afternoon'
      : h >= 17 && h < 22
      ? 'Evening'
      : 'Hello';

  const withName = [
    `${dayPart}, ${rawName}`,
    `Hey ${rawName}`,
    `Welcome back, ${rawName}`,
    `Good to see you, ${rawName}`,
    `Hi ${rawName}`,
    `Hello ${rawName}`,
  ];

  const withoutName = [
    dayPart === 'Hello' ? 'Hello' : `Good ${dayPart.toLowerCase()}`,
    'Welcome back',
    'Hey there',
    'Ready when you are',
    'How can I help?',
  ];

  const pool = rawName ? withName : withoutName;
  return pool[Math.floor(Math.random() * pool.length)];
}

function ChatSwitchSkeleton() {
  return (
    <div className="px-4 sm:px-5 pt-6 pb-6 animate-pulse">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex justify-end">
          <div className="h-14 w-2/3 max-w-sm bg-stone-200/70 rounded-2xl rounded-tr-sm" />
        </div>
        <div className="space-y-3">
          <div className="h-5 w-1/3 bg-stone-200/70 rounded" />
          <div className="h-3.5 w-full bg-stone-200/60 rounded" />
          <div className="h-3.5 w-5/6 bg-stone-200/60 rounded" />
          <div className="h-3.5 w-2/3 bg-stone-200/60 rounded" />
        </div>
        <div className="space-y-2 pt-2">
          <div className="h-3.5 w-1/4 bg-stone-200/60 rounded" />
          <div className="h-3.5 w-full bg-stone-200/50 rounded" />
          <div className="h-3.5 w-4/5 bg-stone-200/50 rounded" />
        </div>
      </div>
    </div>
  );
}

const TYPE_PLACEHOLDER: Record<InputType, string> = {
  text: 'What would you like to scan today?',
  sms: 'Paste an SMS to check…',
  email: 'Paste an email to check…',
  url: 'Paste a link to check…',
};

const SUGGESTION_TEXT: Record<InputType, string> = {
  text: 'Analyze a suspicious message',
  sms: 'Check if an SMS is a scam',
  email: 'Scan an email for phishing',
  url: 'Verify if a link is safe',
};

const TYPE_SHORT_LABEL: Record<InputType, string> = {
  text: 'Text',
  sms: 'SMS',
  email: 'Email',
  url: 'URL',
};

function TypeSegmented({
  value,
  chosen,
  onSelect,
  disabled,
}: {
  value: InputType;
  /** false = nothing picked yet (auto-detect) → no pill is highlighted */
  chosen: boolean;
  onSelect: (t: InputType) => void;
  disabled?: boolean;
}) {
  return (
    <div role="tablist" aria-label="Scan type" className="inline-flex items-center rounded-lg bg-[#F5F4EF] p-0.5">
      {QUICK_ACTIONS.map((a) => {
        const active = chosen && a.id === value;
        return (
          <button
            key={a.id}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={disabled}
            onClick={() => onSelect(a.id)}
            className={`px-2.5 sm:px-3 py-1 rounded-md text-[12.5px] sm:text-[13.5px] transition-colors disabled:opacity-60 ${
              active
                ? 'bg-white text-stone-900 font-medium shadow-sm ring-1 ring-black/10'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            {TYPE_SHORT_LABEL[a.id]}
          </button>
        );
      })}
    </div>
  );
}

const VALID_TYPES: InputType[] = ['text', 'sms', 'email', 'url'];

// Placeholder shown for the first moment, until the AI writes the real steps
const READING_STEP: Record<InputType, string> = {
  email: 'Reading the email',
  sms: 'Reading the SMS',
  url: 'Reading the link',
  text: 'Reading the message',
};

const LINK_TOKEN_RE = /^(?:https?:\/\/|www\.)\S+$|^[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/\S*)?$/i;

// Decide the display style of the user's content:
//  - only a link                      → link card
//  - From:/Subject: headers           → email style
//  - text + link inside (an SMS)      → keeps SMS / email / text (NOT link card)
function refineScanType(text: string, classified: InputType, selected: InputType): InputType {
  const trimmed = text.trim();
  const tokens = trimmed.split(/\s+/).filter(Boolean);
  const linkTokens = tokens.filter((t) => LINK_TOKEN_RE.test(t.replace(/[.,;:!?)]+$/, '')));
  if (tokens.length > 0 && linkTokens.length === tokens.length) return 'url';
  if (/^\s*(from|subject)\s*:/im.test(trimmed)) return 'email';
  if (selected === 'sms' || selected === 'email') return selected;
  return classified === 'url' ? 'sms' : classified;
}

// ─────────────────────────────────────────────────────────────────────────
// Local "is this a question / greeting?" routing (fast path + fallback)
// ─────────────────────────────────────────────────────────────────────────

const URL_IN_TEXT_RE = /(?:https?:\/\/|www\.)\S+|\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|net|org|io|co|pk|info|xyz|top|link|app|ly|me|biz|online|site|club|ru|cn)\b/i;
const EMAIL_HEADER_RE = /^\s*(from|to|subject|date|reply-to)\s*:/im;
const PHONE_IN_TEXT_RE = /(?:\+|00)?\d[\d\s().-]{8,}\d/;

const GREETING_RE =
  /^(hi+|hello+|hey+|salam|assalam[\w\s-]*|aoa|good\s+(morning|afternoon|evening|night)|thanks?|thank\s+you|ok(ay)?|bye|who are you|what can you do)[\s!.?]*$/i;

const STRONG_QUESTION_START_RE =
  /^(what|why|how|when|where|who|which|explain|tell me|define|describe|difference|compare|give me|show me|help me|teach me|suggest|is it safe|can you|could you|kya|kia|kaise|kese|kyun|kyon|kab|kahan|kaun|kon|mujhe|batao|bataiye|samjhao|btao)\b/i;

/** The text contains something that looks like scannable content (link, email headers, phone number). */
function hasScanArtifacts(text: string): boolean {
  return URL_IN_TEXT_RE.test(text) || EMAIL_HEADER_RE.test(text) || PHONE_IN_TEXT_RE.test(text);
}

/** Lenient check: greeting or a question about security / safety / anything general. */
function looksLikeQuestion(text: string): boolean {
  const t = text.trim();
  if (!t || hasScanArtifacts(t)) return false;
  if (GREETING_RE.test(t)) return true;
  const words = t.split(/\s+/).length;
  if (words > 40) return false;
  return t.endsWith('?') || STRONG_QUESTION_START_RE.test(t);
}

/** Strict check used to skip the AI classifier entirely for obvious chat. */
function quickChatRoute(text: string): boolean {
  const t = text.trim();
  if (!t || hasScanArtifacts(t)) return false;
  if (GREETING_RE.test(t)) return true;
  const words = t.split(/\s+/).length;
  return words <= 30 && STRONG_QUESTION_START_RE.test(t);
}

export const MainArea: React.FC<ScannerProps> = ({ onScan }) => {
  const {
    result: contextResult,
    setResult: setContextResult,
    inputContent: contextInputContent,
    setInputContent: setContextInputContent,
    inputType: contextInputType,
    setInputType: setContextInputType,
  } = useScanResult();

  const [inputType, setInputType] = useState<InputType>('text');
  // true only when the user explicitly clicked a scan pill (Text / SMS / Email / URL)
  const [typeChosen, setTypeChosen] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [routing, setRouting] = useState(false); // AI is deciding: scan or chat
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  const [demoText, setDemoText] = useState('');
  const [isTypingDemo, setIsTypingDemo] = useState(false);
  const [shake, setShake] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userLoading, setUserLoading] = useState(true);

  // Random greeting — picked ONCE per mount when auth resolves.
  const [greeting, setGreeting] = useState('');
  const greetingSetRef = useRef(false);

  useEffect(() => {
    if (userLoading) return;
    if (greetingSetRef.current) return;
    greetingSetRef.current = true;

    const rawName = String(
      user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? ''
    ).trim();
    setGreeting(buildGreeting(rawName));
  }, [userLoading, user]);

  const greetingReady = !userLoading && greeting.length > 0;

  const [thinkingSteps, setThinkingSteps] = useState<string[]>([]);

  const [followUpMessages, setFollowUpMessages] = useState<LiveFollowUpMessage[]>([]);
  // General chat that happened BEFORE a scan in the same conversation.
  // Kept on screen (above the scanned content) instead of being wiped.
  const [preMessages, setPreMessages] = useState<LiveFollowUpMessage[]>([]);
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [pendingScan, setPendingScan] = useState<{ text: string; type: InputType } | null>(null);
  const [streamingIndex, setStreamingIndex] = useState<number | null>(null);

  const {
    history: displayHistory,
    loading: historyLoading,
    refresh: refreshHistory,
    pinToggle: handleHistoryPinToggle,
    rename: handleHistoryRename,
    softDelete: handleHistoryDeleteRaw,
  } = useScanHistory(HISTORY_LIMIT);

  const hasScan = loading || !!contextResult || !!errorCode;
  const hasStartedConversation = hasScan || followUpMessages.length > 0 || preMessages.length > 0;
  const isFollowUpMode = !!contextResult && !loading;

  const [panelOpen, setPanelOpen] = useState(false);
  const [panelFullScreen, setPanelFullScreen] = useState(false);
  const [panelMode, setPanelMode] = useState<'document' | 'presentation'>('document');

  const [sidebarManuallyCollapsed, setSidebarManuallyCollapsed] = useState(false);
  const sidebarCollapsed = sidebarManuallyCollapsed;
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [customTitle, setCustomTitle] = useState<string | null>(null);
  const [pinned, setPinned] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [activeScanId, setActiveScanId] = useState<string | null>(null);

  const [activeModal, setActiveModal] = useState<AvatarModalType | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [switchingHistory, setSwitchingHistory] = useState(false);
  const switchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const newScanFlashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs that always hold the latest values (so runScan can read them without
  // being re-created on every message and without stale-closure bugs).
  const followUpMessagesRef = useRef<LiveFollowUpMessage[]>([]);
  const preMessagesRef = useRef<LiveFollowUpMessage[]>([]);
  const contextResultRef = useRef<typeof contextResult>(null);

  useEffect(() => {
    followUpMessagesRef.current = followUpMessages;
  }, [followUpMessages]);
  useEffect(() => {
    preMessagesRef.current = preMessages;
  }, [preMessages]);
  useEffect(() => {
    contextResultRef.current = contextResult;
  }, [contextResult]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleOffline = () => setShowOfflineBanner(true);
    const handleOnline = () => setShowOfflineBanner(false);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setShowOfflineBanner(true);
    }
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const followUpAbortRef = useRef<AbortController | null>(null);
  const thinkingAbortRef = useRef<AbortController | null>(null);
  const thinkingStepsRef = useRef<string[]>([]);
  const typeIndexRef = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // Height of the floating input bar (measured) — the chat scrolls underneath it
  const [inputBarH, setInputBarH] = useState(110);
  const inputBarObserverRef = useRef<ResizeObserver | null>(null);
  const inputBarRef = useCallback((el: HTMLDivElement | null) => {
    inputBarObserverRef.current?.disconnect();
    inputBarObserverRef.current = null;
    if (!el) return;
    setInputBarH(el.offsetHeight);
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => setInputBarH(el.offsetHeight));
      ro.observe(el);
      inputBarObserverRef.current = ro;
    }
  }, []);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const hasAutoScrolledRef = useRef(false);

  const pendingContentRef = useRef<string>('');
  const rafHandleRef = useRef<number | null>(null);
  const assistantIndexRef = useRef<number>(-1);
  const pendingSuggestionsRef = useRef<string[] | undefined>(undefined);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }, [message, panelOpen]);

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } finally {
        setUserLoading(false);
      }
    };
    getUser();
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setUserLoading(false);
    });
    return () => subscription?.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (loading && !hasAutoScrolledRef.current) {
      hasAutoScrolledRef.current = true;
      requestAnimationFrame(() => {
        progressRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
    if (!loading) {
      hasAutoScrolledRef.current = false;
    }
  }, [loading]);

  useEffect(() => {
    if (!loading && contextResult) {
      requestAnimationFrame(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [loading, contextResult]);

  useEffect(() => {
    if (followUpMessages.length === 0) return;
    requestAnimationFrame(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  }, [followUpMessages.length, followUpLoading]);

  useEffect(() => {
    return () => {
      if (switchTimeoutRef.current) clearTimeout(switchTimeoutRef.current);
      if (newScanFlashTimeoutRef.current) clearTimeout(newScanFlashTimeoutRef.current);
    };
  }, []);

  const isNearBottom = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < AUTO_SCROLL_THRESHOLD_PX;
  }, []);

  const stopGhostScene = useCallback(() => {
    setIsTypingDemo(false);
    setDemoText('');
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
  }, []);

  const runGhostTypewriter = useCallback((targetText: string) => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
    setMessage('');
    setDemoText('');
    setIsTypingDemo(true);
    typeIndexRef.current = 0;

    typingIntervalRef.current = setInterval(() => {
      const i = typeIndexRef.current;
      if (i < targetText.length) {
        setDemoText(targetText.slice(0, i + 1));
        typeIndexRef.current = i + 1;
      } else if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
    }, 15);
  }, []);

  // ── Reset the scan pill (back to auto-detect) ────────────────────────────
  const handleResetType = useCallback(() => {
    stopGhostScene();
    setTypeChosen(false);
    setInputType('text');
    setErrorCode(null);
    textareaRef.current?.focus();
  }, [stopGhostScene]);

  const handleActionClick = useCallback(
    (type: InputType) => {
      // clicking the already-selected pill again = reset
      if (typeChosen && inputType === type) {
        handleResetType();
        return;
      }
      setInputType(type);
      setTypeChosen(true);
      setErrorCode(null);
      setMessage('');
      runGhostTypewriter(SAMPLE_SENTENCES[type]);
      textareaRef.current?.focus();
    },
    [typeChosen, inputType, handleResetType, runGhostTypewriter]
  );

  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
      abortControllerRef.current?.abort();
      followUpAbortRef.current?.abort();
      thinkingAbortRef.current?.abort();
      if (rafHandleRef.current !== null) cancelAnimationFrame(rafHandleRef.current);
    };
  }, []);

  const hasContent = message.trim().length > 0;

  const streamThinking = useCallback(
    async (content: string, type: InputType, signal: AbortSignal) => {
      try {
        const res = await fetch('/api/scan-thinking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, type }),
          signal,
        });
        if (!res.ok || !res.body) return;
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = '';
        const toSteps = (text: string, final: boolean) => {
          const lines = text.split('\n');
          const complete = final ? lines : lines.slice(0, -1);
          return complete
            .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').replace(/[.…]+$/, '').trim())
            .filter((l) => l.length > 0 && l.length <= 60)
            .slice(0, 7);
        };
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          const partial = toSteps(acc, false);
          thinkingStepsRef.current = partial;
          setThinkingSteps(partial);
        }
        const all = toSteps(acc, true);
        thinkingStepsRef.current = all;
        setThinkingSteps(all);
      } catch {
        /* best-effort */
      }
    },
    []
  );

  // ── AI input router: scan content vs. chat question ──────────────────────
  const classifyInput = useCallback(
    async (text: string): Promise<{ route: 'scan' | 'chat'; scanType: InputType }> => {
      try {
        const res = await fetch('/api/classify-input', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
          signal: AbortSignal.timeout(9000),
        });
        if (!res.ok) throw new Error('classify failed');
        const data = await res.json();
        return {
          route: data.route === 'scan' ? 'scan' : 'chat',
          scanType: (VALID_TYPES.includes(data.scanType) ? data.scanType : 'text') as InputType,
        };
      } catch {
        // Classifier down → decide locally:
        //  - greeting / question → chat
        //  - inside a scan chat and no link/headers/number → chat
        //  - otherwise → scan
        const question = looksLikeQuestion(text);
        const route: 'scan' | 'chat' = question
          ? 'chat'
          : isFollowUpMode && !hasScanArtifacts(text)
          ? 'chat'
          : 'scan';
        return { route, scanType: typeChosen ? inputType : 'text' };
      }
    },
    [isFollowUpMode, inputType, typeChosen]
  );

  const runScan = useCallback(async (rawContent: string, type: InputType) => {
    const finalContent = rawContent.trim();
    if (!finalContent) {
      setShake(true);
      setTimeout(() => setShake(false), 600);
      textareaRef.current?.focus();
      return;
    }

    stopGhostScene();
    setPanelOpen(false);
    setPanelFullScreen(false);

    // ── Keep the earlier general chat ──────────────────────────────────────
    // If the user was just chatting (no scan result yet), move those messages
    // above the new scan instead of wiping them.
    followUpAbortRef.current?.abort();
    if (rafHandleRef.current !== null) {
      cancelAnimationFrame(rafHandleRef.current);
      rafHandleRef.current = null;
    }
    let preForSave: LiveFollowUpMessage[] = preMessagesRef.current;
    if (!contextResultRef.current && followUpMessagesRef.current.length > 0) {
      const carried = followUpMessagesRef.current
        .map((m, idx, arr) =>
          m.streaming && idx === arr.length - 1 && m.role === 'assistant'
            ? { ...m, content: pendingContentRef.current || m.content, streaming: false }
            : { ...m, streaming: false }
        )
        .filter((m) => m.role === 'user' || m.content.trim().length > 0);
      preForSave = [...preMessagesRef.current, ...carried];
      preMessagesRef.current = preForSave;
      setPreMessages(preForSave);
    }

    // Show a derived title in the header right away; the AI title replaces it.
    setCustomTitle(deriveFallbackTitle(finalContent, type));
    setPinned(false);
    setActiveScanId(null);
    setFollowUpMessages([]);
    setFollowUpLoading(false);
    setPendingScan(null);
    setStreamingIndex(null);
    setTypeChosen(false);

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timeoutId = setTimeout(() => controller.abort('timeout'), REQUEST_TIMEOUT_MS);

    setLoading(true);
    setErrorCode(null);
    setContextResult(null);
    setContextInputContent(finalContent);
    setContextInputType(type);
    setMessage('');

    thinkingAbortRef.current?.abort();
    const thinkingController = new AbortController();
    thinkingAbortRef.current = thinkingController;
    setThinkingSteps([]);
    thinkingStepsRef.current = [];
    void streamThinking(finalContent, type, thinkingController.signal);

    const startedAt = Date.now();

    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setErrorCode('offline');
        return;
      }

      const res = await fetch('/api/scam-detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: finalContent, type }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setErrorCode(extractErrorCode(errData));
        return;
      }

      const data = (await res.json()) as ScamResultWithFindings;
      const scanId = `#SCY-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;
      const scanResult: ScamResultWithFindings = { ...data, scanId };

      const elapsed = Date.now() - startedAt;
      // Stay on screen long enough for the content-specific thinking steps to be read
      const stepCount = Math.min(thinkingStepsRef.current.length + 1, 8);
      const minMs = Math.min(
        THINKING_MAX_MS,
        Math.max(MIN_SCAN_DURATION_MS, stepCount * THINKING_STEP_MS + 800)
      );
      if (elapsed < minMs) {
        await new Promise((resolve) => setTimeout(resolve, minMs - elapsed));
      }
      if (controller.signal.aborted) return;

      setContextResult(scanResult);

      // ── AI title for header + sidebar (best-effort, falls back) ──
      let aiTitle: string | null = null;
      try {
        const titleRes = await fetch('/api/generate-title', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: finalContent, type, result: scanResult }),
          signal: controller.signal,
        });
        if (titleRes.ok) {
          const titleData = (await titleRes.json()) as { title?: string | null };
          aiTitle = titleData.title?.trim() || null;
        }
      } catch (titleErr) {
        console.error('Title generation failed:', titleErr);
      }
      if (controller.signal.aborted) return;

      const resolvedTitle = aiTitle ?? deriveFallbackTitle(finalContent, type);
      setCustomTitle(resolvedTitle);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const typeMap: Record<string, 'Email' | 'Text' | 'URL'> = {
            text: 'Text', sms: 'Text', email: 'Email', url: 'URL',
          };
          const { data: savedRow, error: saveError } = await supabase
            .from('scans')
            .insert({
              user_id: user.id,
              type: typeMap[type] ?? 'Text',
              title: resolvedTitle,
              content: finalContent,
              risk_level: scanResult.riskLevel === 'high' ? 'High' : scanResult.riskLevel === 'medium' ? 'Medium' : 'Low',
              risk_score: scanResult.riskScore,
              is_scam: scanResult.riskLevel !== 'low',
              details: buildScanDetails(scanResult, [], type, preForSave),
            })
            .select('id')
            .single();
          if (saveError) throw saveError;
          if (savedRow) setActiveScanId(savedRow.id);
          refreshHistory();
        }
      } catch (dbError) {
        console.error('Failed to save scan:', dbError);
      }

      onScan?.({
        input_content: finalContent,
        scan_type: type,
        is_scam: scanResult.riskLevel !== 'low',
        risk_score: scanResult.riskScore,
        risk_level: scanResult.riskLevel,
        explanation: scanResult.explanation,
        safety_tips: scanResult.safetyTips as any,
      });
    } catch (err: unknown) {
      // A newer scan replaced this one → ignore silently
      if (abortControllerRef.current !== controller) return;
      // controller.abort('timeout') makes fetch reject with the string 'timeout' (not an AbortError)
      if (err === 'timeout' || controller.signal.reason === 'timeout' || (err instanceof Error && err.name === 'AbortError')) {
        setErrorCode('timeout');
        return;
      }
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setErrorCode('offline');
        return;
      }
      console.error('Scan failed:', err);
      setErrorCode('unknown');
    } finally {
      clearTimeout(timeoutId);
      thinkingController.abort();
      if (abortControllerRef.current === controller) {
        setLoading(false);
        setThinkingSteps([]);
      }
    }
  }, [stopGhostScene, setContextResult, setContextInputContent, setContextInputType, onScan, refreshHistory, streamThinking]);

  const handleFollowUpSend = useCallback(async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed) return;

    const userTurn: FollowUpMessage = { role: 'user', content: trimmed };
    setFollowUpMessages((prev) => [...prev, userTurn]);

    const assistantIndex = followUpMessages.length + 1;
    assistantIndexRef.current = assistantIndex;
    pendingContentRef.current = '';
    pendingSuggestionsRef.current = undefined;
    if (rafHandleRef.current !== null) {
      cancelAnimationFrame(rafHandleRef.current);
      rafHandleRef.current = null;
    }

    const placeholder: LiveFollowUpMessage = { role: 'assistant', content: '', streaming: true };
    setFollowUpMessages((prev) => [...prev, placeholder]);
    setStreamingIndex(assistantIndex);
    setFollowUpLoading(true);

    followUpAbortRef.current?.abort();
    const controller = new AbortController();
    followUpAbortRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort('timeout'), REQUEST_TIMEOUT_MS);

    const persistFollowUp = (assistantContent: string, suggestions?: string[]) => {
      if (!activeScanId) return;
      const finalThread: FollowUpMessage[] = [
        ...followUpMessages,
        userTurn,
        { role: 'assistant', content: assistantContent, suggestions },
      ];
      supabase
        .from('scans')
        .update({
          details: buildScanDetails(
            contextResult as ScamResultWithFindings | null,
            finalThread,
            contextInputType as InputType,
            preMessagesRef.current
          ),
        })
        .eq('id', activeScanId)
        .then(({ error }) => {
          if (error) console.error('Failed to save follow-up:', error);
        });
    };

    const setBubbleFallback = (text: string) => {
      if (rafHandleRef.current !== null) {
        cancelAnimationFrame(rafHandleRef.current);
        rafHandleRef.current = null;
      }
      setFollowUpMessages((prev) =>
        prev.map((msg, idx) =>
          idx === assistantIndex ? { role: 'assistant', content: text, streaming: false } : msg
        )
      );
    };

    const flushPending = () => {
      const idx = assistantIndexRef.current;
      setFollowUpMessages((prev) =>
        prev.map((msg, i) => (i === idx ? { ...msg, content: pendingContentRef.current, streaming: true } : msg))
      );
      if (isNearBottom()) {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
      rafHandleRef.current = null;
    };

    const scheduleFlush = () => {
      if (rafHandleRef.current === null) {
        rafHandleRef.current = requestAnimationFrame(flushPending);
      }
    };

    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setBubbleFallback("I can't reach the network right now. Please check your connection and try again.");
        return;
      }

      const res = await fetch('/api/scam-followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: trimmed,
          // earlier general chat + this scan's follow-ups, so the AI keeps the full context
          history: [...preMessagesRef.current, ...followUpMessages],
          context: contextResult
            ? {
                inputContent: contextInputContent,
                inputType: contextInputType,
                result: contextResult,
              }
            : null,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        await res.json().catch(() => ({}));
        setBubbleFallback("I couldn't process that just now. Please try asking again in a moment.");
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setBubbleFallback("I couldn't process that just now. Please try asking again in a moment.");
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;
          const payload = trimmedLine.slice(6);
          if (payload === '[DONE]') continue;

          try {
            const data = JSON.parse(payload);
            if (data.type === 'chunk') {
              accumulated += data.content;
              pendingContentRef.current = accumulated;
              scheduleFlush();
            } else if (data.type === 'redirect') {
              accumulated = data.content;
              pendingContentRef.current = accumulated;
              pendingSuggestionsRef.current =
                Array.isArray(data.suggestions) && data.suggestions.length > 0
                  ? data.suggestions
                  : REDIRECT_SUGGESTIONS;
              if (rafHandleRef.current !== null) {
                cancelAnimationFrame(rafHandleRef.current);
                rafHandleRef.current = null;
              }
              setFollowUpMessages((prev) =>
                prev.map((msg, idx) =>
                  idx === assistantIndex
                    ? { role: 'assistant', content: accumulated, suggestions: pendingSuggestionsRef.current, streaming: true }
                    : msg
                )
              );
            } else if (data.type === 'redirect_append') {
              accumulated += data.content;
              pendingContentRef.current = accumulated;
              scheduleFlush();
            } else if (data.type === 'suggestions') {
              if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
                pendingSuggestionsRef.current = data.suggestions;
                setFollowUpMessages((prev) =>
                  prev.map((msg, idx) =>
                    idx === assistantIndex ? { ...msg, suggestions: data.suggestions } : msg
                  )
                );
              }
            } else if (data.type === 'stream_error') {
              if (rafHandleRef.current !== null) {
                cancelAnimationFrame(rafHandleRef.current);
                rafHandleRef.current = null;
              }
              const partial = pendingContentRef.current || accumulated;
              setFollowUpMessages((prev) =>
                prev.map((msg, idx) =>
                  idx === assistantIndex
                    ? {
                        ...msg,
                        content: partial
                          ? `${partial}\n\n_The response was interrupted. Feel free to ask again._`
                          : "The response was interrupted. Please try asking again.",
                        streaming: false,
                      }
                    : msg
                )
              );
              setStreamingIndex(null);
            } else if (data.type === 'done') {
              if (rafHandleRef.current !== null) {
                cancelAnimationFrame(rafHandleRef.current);
                rafHandleRef.current = null;
              }
              const finalContent = pendingContentRef.current || accumulated;
              setFollowUpMessages((prev) =>
                prev.map((msg, idx) =>
                  idx === assistantIndex ? { ...msg, content: finalContent || msg.content, streaming: false } : msg
                )
              );
              setStreamingIndex(null);
              persistFollowUp(finalContent, pendingSuggestionsRef.current);
            }
          } catch (e) {
            // ignore parse errors
          }
        }
      }
    } catch (err) {
      if (err === 'timeout' || (err instanceof DOMException && err.name === 'AbortError')) {
        if (controller.signal.reason === 'timeout') {
          setBubbleFallback("That took longer than expected. Please try asking again.");
        }
        return;
      }
      console.error('Follow-up failed:', err);
      setBubbleFallback("I ran into an issue getting a response. Please try asking again.");
    } finally {
      clearTimeout(timeoutId);
      setFollowUpLoading(false);
      setStreamingIndex(null);
      if (followUpAbortRef.current === controller) {
        followUpAbortRef.current = null;
      }
    }
  }, [contextResult, contextInputContent, contextInputType, followUpMessages, isNearBottom, activeScanId]);

  const handleStopFollowUp = useCallback(() => {
    followUpAbortRef.current?.abort();
    if (rafHandleRef.current !== null) {
      cancelAnimationFrame(rafHandleRef.current);
      rafHandleRef.current = null;
    }
    const idx = assistantIndexRef.current;
    setFollowUpMessages((prev) =>
      prev.map((msg, i) =>
        i === idx ? { ...msg, content: pendingContentRef.current || msg.content, streaming: false } : msg
      )
    );
    setFollowUpLoading(false);
    setStreamingIndex(null);
  }, []);

  const handleSuggestionClick = useCallback((text: string) => {
    void handleFollowUpSend(text);
  }, [handleFollowUpSend]);

  const handleConfirmPendingScan = useCallback(() => {
    if (!pendingScan) return;
    const { text, type } = pendingScan;
    setPendingScan(null);

    if (newScanFlashTimeoutRef.current) clearTimeout(newScanFlashTimeoutRef.current);

    setContextResult(null);
    setContextInputContent('');
    setPanelOpen(false);
    setPanelFullScreen(false);
    stopGhostScene();
    setErrorCode(null);
    setLoading(false);
    setThinkingSteps([]);
    setCustomTitle(null);
    setPinned(false);
    setActiveScanId(null);
    setFollowUpMessages([]);
    setPreMessages([]);
    setFollowUpLoading(false);
    setStreamingIndex(null);
    setInputType(type);
    setTypeChosen(false);
    setMessage('');

    newScanFlashTimeoutRef.current = setTimeout(() => {
      void runScan(text, type);
    }, NEW_SCAN_HOME_FLASH_MS);
  }, [pendingScan, runScan, stopGhostScene, setContextResult, setContextInputContent]);

  const handleCancelPendingScan = useCallback(() => {
    setPendingScan(null);
  }, []);

  const isFollowUpBusy = followUpLoading;

  // ── Single entry point for the input box (home + chat) ───────────────────
  const handleScan = useCallback(async () => {
    if (routing) return;

    const trimmed = message.trim();
    if (!trimmed) {
      setShake(true);
      setTimeout(() => setShake(false), 600);
      textareaRef.current?.focus();
      return;
    }

    // Same content again → rescan directly, no AI routing needed
    if (isFollowUpMode && isSameContent(trimmed, contextInputContent)) {
      setMessage('');
      void runScan(trimmed, (contextInputType as InputType) ?? inputType);
      return;
    }

    let route: 'scan' | 'chat';
    let classifiedType: InputType;

    if (!typeChosen && quickChatRoute(trimmed)) {
      // Obvious greeting / general or cybersecurity question → straight to chat,
      // no scan and no waiting for the classifier.
      route = 'chat';
      classifiedType = 'text';
    } else {
      setRouting(true);
      const r = await classifyInput(trimmed);
      setRouting(false);
      route = r.route;
      classifiedType = r.scanType;
    }

    const scanType = refineScanType(trimmed, classifiedType, typeChosen ? inputType : 'text');

    if (route === 'chat') {
      setMessage('');
      stopGhostScene();
      void handleFollowUpSend(trimmed);
      return;
    }

    // route === 'scan'
    setMessage('');
    if (isFollowUpMode) {
      // a scan is already open → confirm before starting a new one
      setPendingScan({ text: trimmed, type: scanType });
      return;
    }
    setInputType(scanType);
    void runScan(trimmed, scanType);
  }, [
    routing,
    message,
    isFollowUpMode,
    contextInputContent,
    contextInputType,
    inputType,
    typeChosen,
    classifyInput,
    runScan,
    handleFollowUpSend,
    stopGhostScene,
  ]);

  const handleRetry = useCallback(
    () => runScan(contextInputContent, (contextInputType as InputType) ?? 'text'),
    [runScan, contextInputContent, contextInputType]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        void handleScan();
      }
    },
    [handleScan]
  );

  const handleNewScan = useCallback(() => {
    setContextResult(null);
    setContextInputContent('');
    setMessage('');
    setPanelOpen(false);
    setPanelFullScreen(false);
    stopGhostScene();
    setErrorCode(null);
    setLoading(false);
    setRouting(false);
    setThinkingSteps([]);
    thinkingAbortRef.current?.abort();
    followUpAbortRef.current?.abort();
    setCustomTitle(null);
    setPinned(false);
    setActiveScanId(null);
    setFollowUpMessages([]);
    setPreMessages([]);
    setFollowUpLoading(false);
    setPendingScan(null);
    setStreamingIndex(null);
    setTypeChosen(false);
    setInputType('text');
    textareaRef.current?.focus();
  }, [setContextResult, setContextInputContent, stopGhostScene]);

  const handleClosePanel = useCallback(() => {
    setPanelOpen(false);
    setPanelFullScreen(false);
  }, []);

  const handleToggleFullScreen = useCallback(() => {
    setPanelFullScreen((f) => !f);
  }, []);

  const handleEditUserMessage = useCallback(() => {
    setMessage(contextInputContent);
    textareaRef.current?.focus();
  }, [contextInputContent]);

  const handleEditFollowUp = useCallback((content: string) => {
    setMessage(content);
    textareaRef.current?.focus();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = '/';
  };

  const handleSelectHistory = useCallback((id: string) => {
    const entry = displayHistory.find((h) => h.id === id);
    if (!entry) return;

    if (switchTimeoutRef.current) clearTimeout(switchTimeoutRef.current);
    setSwitchingHistory(true);

    const row = entry.raw;
    const details = row.details ?? {};
    const savedType = String(details.scanType ?? '').toLowerCase();
    const resolvedType = (
      VALID_TYPES.includes(savedType as InputType) ? savedType : (row.type ?? 'Text').toString().toLowerCase()
    ) as InputType;
    const resolvedContent = row.content ?? '';

    setContextInputContent(resolvedContent);
    setContextInputType(resolvedType);
    setContextResult({
      riskScore: row.risk_score ?? 0,
      riskLevel: ((row.risk_level ?? 'low') as string).toLowerCase(),
      explanation: details.explanation ?? '',
      safetyTips: details.safetyTips ?? [],
      findings: details.findings ?? [],
      recommendation: details.recommendation ?? undefined,
      attemptLabel: details.attemptLabel ?? undefined,
      threatType: details.threatType ?? undefined,
      indicators: details.indicators ?? [],
      metaRows: details.metaRows ?? [],
      targetBrand: details.targetBrand ?? undefined,
      status: details.status ?? undefined,
      cvss: details.cvss ?? undefined,
      reportTitle: details.reportTitle ?? undefined,
      scanId: details.scanId ?? row.id,
    } as any);
    setErrorCode(null);
    setPanelOpen(false);
    setPanelFullScreen(false);
    setCustomTitle(row.title ?? deriveFallbackTitle(resolvedContent, resolvedType));
    setPinned(!!row.pinned);
    setActiveScanId(row.id);
    setPreMessages(
      ((details.preMessages ?? []) as LiveFollowUpMessage[]).map((f) => ({ ...f, streaming: false }))
    );
    setFollowUpMessages(
      ((details.followUps ?? []) as LiveFollowUpMessage[]).map((f) => ({ ...f, streaming: false }))
    );
    setFollowUpLoading(false);
    setPendingScan(null);
    setStreamingIndex(null);
    setTypeChosen(false);

    switchTimeoutRef.current = setTimeout(() => {
      setSwitchingHistory(false);
    }, HISTORY_SWITCH_SKELETON_MS);
  }, [displayHistory, setContextInputContent, setContextInputType, setContextResult]);

  const handleHistoryShare = useCallback(async (id: string) => {
    const entry = displayHistory.find((h) => h.id === id);
    const shareText = entry ? `Custos AI — ${entry.label}` : 'Custos AI scan';
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Custos AI', text: shareText });
      } catch {
        /* user cancelled */
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
      } catch (err) {
        console.error('Share failed:', err);
      }
    }
  }, [displayHistory]);

  const handleHistoryViewDocument = useCallback((id: string) => {
    handleSelectHistory(id);
    setPanelMode('document');
    setPanelOpen(true);
    if (!sidebarCollapsed) setSidebarManuallyCollapsed(true);
  }, [handleSelectHistory, sidebarCollapsed]);

  const handleHistoryViewPresentation = useCallback((id: string) => {
    handleSelectHistory(id);
    setPanelMode('presentation');
    setPanelOpen(true);
    if (!sidebarCollapsed) setSidebarManuallyCollapsed(true);
  }, [handleSelectHistory, sidebarCollapsed]);

  const handleOpenDocumentReport = useCallback(() => {
    setPanelMode('document');
    setPanelOpen(true);
    if (!sidebarCollapsed) setSidebarManuallyCollapsed(true);
  }, [sidebarCollapsed]);

  const handleOpenPresentationReport = useCallback(() => {
    setPanelMode('presentation');
    setPanelOpen(true);
    if (!sidebarCollapsed) setSidebarManuallyCollapsed(true);
  }, [sidebarCollapsed]);

  // Kept for compatibility with the ReportPanel `onDownload` prop.
  // (The updated ReportPanel generates the A4 PDF by itself.)
  const handleDownloadReport = useCallback(async () => {
    if (!contextResult || !contextInputContent) return;
    try {
      const data = buildReportDocumentData(contextResult, contextInputContent, contextInputType);
      await generatePDFReport(
        contextResult,
        contextInputType,
        contextInputContent,
        '',
        data.indicators || [],
        data.reportId || `SCY-${Date.now()}`,
        data.cvss || `${contextResult.riskScore / 10}/10`,
        data.campaignStatus || 'Under Review',
        data.threatTypeLabel || 'Unclassified',
        data.targetBrand || 'Unknown',
        {}
      );
    } catch (err) {
      console.error('PDF download failed:', err);
    }
  }, [contextResult, contextInputContent, contextInputType]);

  const topHeaderLabel =
    customTitle ??
    (contextResult
      ? deriveFallbackTitle(contextInputContent, (contextInputType as InputType) ?? 'text')
      : 'New chat');

  const handleRenameStart = useCallback(() => {
    setRenameValue(topHeaderLabel);
    setRenaming(true);
  }, [topHeaderLabel]);

  const handleRenameCommit = useCallback(() => {
    const trimmed = renameValue.trim();
    if (trimmed) {
      setCustomTitle(trimmed);
      if (activeScanId) handleHistoryRename(activeScanId, trimmed);
    }
    setRenaming(false);
  }, [renameValue, activeScanId, handleHistoryRename]);

  const handlePinToggle = useCallback(() => {
    setPinned((p) => !p);
    if (activeScanId) handleHistoryPinToggle(activeScanId);
  }, [activeScanId, handleHistoryPinToggle]);

  const handleHeaderShare = useCallback(async () => {
    const shareText = contextResult
      ? `Custos AI scan — Risk Score: ${contextResult.riskScore}/100 (${getRiskLevelLabel(contextResult.riskLevel)})`
      : `Custos AI — ${topHeaderLabel}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Custos AI', text: shareText });
      } catch {
        /* user cancelled */
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
      } catch (err) {
        console.error('Share failed:', err);
      }
    }
  }, [contextResult, topHeaderLabel]);

  const handleHeaderDelete = useCallback(() => {
    if (activeScanId) {
      setConfirmDeleteId(activeScanId);
    } else {
      handleNewScan();
    }
  }, [activeScanId, handleNewScan]);

  const handleRequestHistoryDelete = useCallback((id: string) => {
    setConfirmDeleteId(id);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!confirmDeleteId) return;
    handleHistoryDeleteRaw(confirmDeleteId);
    if (confirmDeleteId === activeScanId) {
      handleNewScan();
    }
    setConfirmDeleteId(null);
  }, [confirmDeleteId, activeScanId, handleHistoryDeleteRaw, handleNewScan]);

  // ── Input box ──────────────────────────────────────────────────────────
  const renderInputBox = (variant: 'home' | 'chat') => {
    const isHome = variant === 'home';
    const placeholderText = isFollowUpMode
      ? FOLLOWUP_PLACEHOLDER
      : isHome
      ? TYPE_PLACEHOLDER[typeChosen ? inputType : 'text']
      : INPUT_PLACEHOLDER;
    const typedTypography = getMessageTypography(message);
    const showStop = !isHome && isFollowUpBusy;
    // Scan pills are available until a scan result exists (home, general chat, errors)
    const canPickType = isHome || !isFollowUpMode;
    const compact = !isHome && !canPickType;
    const padClass = compact ? 'px-4 py-3' : 'px-4 pt-4 pb-1';
    const busy = loading || routing;

    const textareaNode = (
      <div className="relative w-full min-w-0 flex-1">
        <textarea
          ref={textareaRef}
          value={message}
          dir={typedTypography.dir}
          onChange={(e) => {
            stopGhostScene();
            setMessage(e.target.value);
          }}
          onPaste={(e) => {
            e.preventDefault();
            stopGhostScene();
            setMessage(e.clipboardData.getData('text'));
          }}
          onKeyDown={handleKeyDown}
          placeholder={isTypingDemo ? '' : placeholderText}
          rows={1}
          disabled={busy}
          // 17px on phones (>=16px so iOS never zooms), 18px on desktop
          className={`w-full bg-transparent ${padClass} border-none outline-none resize-none text-stone-900 placeholder:text-stone-500 text-[16px] sm:text-[17px] placeholder:text-[15px] sm:placeholder:text-[16.5px] leading-[1.55] relative z-10 ${
            busy ? 'opacity-60 cursor-not-allowed' : ''
          }`}
          style={{
            fontFamily: typedTypography.fontFamily,
            minHeight: compact ? 30 : isHome ? 60 : 52,
            maxHeight: 200,
            overflowY: 'auto',
          }}
        />
        {isTypingDemo && !message && !busy && (
          <div
            className={`absolute inset-0 pointer-events-none ${padClass} text-[16px] sm:text-[17px] leading-[1.55] text-stone-400/80 z-0 select-none whitespace-pre-wrap`}
            style={{ fontFamily: FONT_BODY }}
          >
            {demoText}
            <span className="animate-pulse font-semibold text-stone-500 ml-0.5">|</span>
          </div>
        )}
      </div>
    );

    const sendButton = (
      <button
        onClick={() => (showStop ? handleStopFollowUp() : void handleScan())}
        disabled={busy || (!hasContent && !showStop)}
        title={routing ? 'Checking…' : loading ? 'Scanning…' : showStop ? 'Stop' : isFollowUpMode ? 'Send' : 'Scan'}
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
          busy || showStop
            ? 'bg-blue-600 cursor-pointer shadow-sm'
            : hasContent
            ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer shadow-sm'
            : 'bg-stone-200 cursor-not-allowed'
        }`}
      >
        {busy ? (
          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : showStop ? (
          <Square className="w-3 h-3 text-white" fill="currentColor" strokeWidth={0} />
        ) : (
          <ArrowUp className={`w-4 h-4 ${hasContent ? 'text-white' : 'text-stone-400'}`} />
        )}
      </button>
    );

    return (
      <div
        className={`${shake ? 'scyra-shake' : ''} bg-white ${
          isHome ? 'rounded-[22px]' : 'rounded-[20px]'
        } border shadow-[0_2px_8px_rgba(0,0,0,0.04)] focus-within:shadow-[0_4px_16px_rgba(0,0,0,0.08)] relative transition-shadow duration-200 ${
          shake ? 'border-red-300' : 'border-black/10 focus-within:border-black/20'
        }`}
      >
        {compact ? (
          <div className="flex items-end gap-2 pr-2.5">
            {textareaNode}
            <div className="mb-2">{sendButton}</div>
          </div>
        ) : (
          <>
            {textareaNode}
            <div className="flex items-center justify-between gap-2 px-3 pb-3 pt-1">
              <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                <TypeSegmented
                  value={inputType}
                  chosen={typeChosen}
                  onSelect={handleActionClick}
                  disabled={busy}
                />
                {typeChosen && (
                  <button
                    type="button"
                    onClick={handleResetType}
                    disabled={busy}
                    title="Reset scan type"
                    aria-label="Reset scan type"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[13px] text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors disabled:opacity-60"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset
                  </button>
                )}
              </div>
              {sendButton}
            </div>
          </>
        )}
      </div>
    );
  };

  const suggestionsList = (
    <div className="w-full flex flex-col gap-0.5">
      {QUICK_ACTIONS.map((a) => {
        const Icon = a.icon;
        return (
          <button
            key={a.id}
            onClick={() => handleActionClick(a.id)}
            className="flex items-center gap-3 sm:gap-4 px-2.5 sm:px-3 py-2.5 rounded-2xl text-left text-[14.5px] sm:text-[15.5px] text-stone-800 hover:bg-stone-200/60 transition-colors"
          >
            <Icon className="w-[18px] h-[18px] text-stone-600 flex-shrink-0" strokeWidth={1.6} />
            <span className="truncate">{SUGGESTION_TEXT[a.id]}</span>
          </button>
        );
      })}
    </div>
  );

  const lastTurn = followUpMessages[followUpMessages.length - 1];
  const replyComplete =
    !loading &&
    !followUpLoading &&
    !followUpMessages.some((msg) => msg.streaming) &&
    (!lastTurn || (lastTurn.role === 'assistant' && lastTurn.content.trim().length > 0));
  const showDisclaimer = replyComplete && (!!contextResult || followUpMessages.length > 0);

  const headerBar = (
    <div className="flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-5 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 min-h-[56px] sm:min-h-[60px] flex-shrink-0 bg-transparent">
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        {/* Mobile: only the menu icon on the left (no chat name — it lives in the ⋮ dropdown) */}
        <button
          onClick={() => setMobileSidebarOpen(true)}
          title="Open menu"
          aria-label="Open menu"
          className="md:hidden w-10 h-10 -ml-1 rounded-full text-stone-800 hover:bg-stone-200/60 active:bg-stone-200/60 transition-colors flex-shrink-0 flex items-center justify-center"
        >
          <HamburgerIcon />
        </button>

        {/* Desktop: chat name + dropdown */}
        <div className="hidden md:flex items-center gap-1 min-w-0">
          {!hasStartedConversation ? null : renaming ? (
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={handleRenameCommit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameCommit();
                if (e.key === 'Escape') setRenaming(false);
              }}
              className="text-[14.5px] font-medium text-stone-800 bg-white rounded-lg px-2.5 py-1 outline-none border border-black/10 focus:border-black/20"
              style={{ fontFamily: FONT_BODY }}
            />
          ) : (
            <>
              <span
                key={`d-${topHeaderLabel}`}
                className="text-[14.5px] font-medium text-stone-800 truncate flex items-center gap-1.5 animate-[scyraFadeIn_0.35s_ease-out]"
                style={{ fontFamily: FONT_BODY }}
              >
                {topHeaderLabel}
                {pinned && hasScan && <Pin className="w-3 h-3 text-stone-600 fill-stone-600" />}
              </span>
              {hasScan && (
                <ChatHeaderMenu
                  onRename={handleRenameStart}
                  onPin={handlePinToggle}
                  onDelete={handleHeaderDelete}
                  onOpenDocument={handleOpenDocumentReport}
                  onOpenPresentation={handleOpenPresentationReport}
                  pinned={pinned}
                />
              )}
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        {hasScan && !renaming && (
          <button
            onClick={handleHeaderShare}
            title="Share"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-stone-600 hover:bg-stone-200/60 transition-colors text-[13.5px] font-normal"
          >
            <Share2 className="w-3.5 h-3.5" />
            Share
          </button>
        )}

        {/* Mobile right side: new scan (black circle) + ⋮ dropdown — only inside a chat */}
        {hasStartedConversation && (
          <div className="md:hidden flex items-center gap-1">
            <NewChatButton onClick={handleNewScan} />
            {hasScan && (
              <MobileChatHeaderMenu
                title={topHeaderLabel}
                onShare={handleHeaderShare}
                onRename={handleRenameStart}
                onPin={handlePinToggle}
                onDelete={handleHeaderDelete}
                onOpenDocument={handleOpenDocumentReport}
                onOpenPresentation={handleOpenPresentationReport}
                pinned={pinned}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-[100dvh] w-full">
      {showOfflineBanner && (
        <ErrorBanner
          code="offline"
          onDismiss={() => setShowOfflineBanner(false)}
          onRetry={() => window.location.reload()}
        />
      )}

      <div className={`flex flex-1 min-h-0 w-full ${PAGE_WASH_BG} overflow-hidden`} style={{ fontFamily: FONT_BODY }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Urdu:wght@400;600;700&family=Noto+Sans+Devanagari:wght@400;500;600&display=swap');

        @keyframes scyraFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scyraSlideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        @keyframes scyra-shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-4px); }
          40% { transform: translateX(4px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(3px); }
        }
        .scyra-shake {
          animation: scyra-shake 0.4s ease-in-out;
        }

        @keyframes scyraShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .scyra-shimmer-text {
          background-image: linear-gradient(
            90deg,
            #a8a29e 0%,
            #a8a29e 35%,
            #ffffff 50%,
            #a8a29e 65%,
            #a8a29e 100%
          );
          background-size: 250% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: scyraShimmer 2.2s ease-in-out infinite alternate;
        }

        /* kept for any other component still using it — no more orange */
        @keyframes scyraSweep {
          from { background-position: 100% 0; }
          to { background-position: 0% 0; }
        }
        .scyra-sweep-text {
          background-image: linear-gradient(
            90deg,
            #78716c 0%,
            #78716c 40%,
            #d6d3d1 50%,
            #78716c 60%,
            #78716c 100%
          );
          background-size: 250% 100%;
          background-repeat: no-repeat;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          -webkit-text-fill-color: transparent;
          animation: scyraSweep 0.85s ease-in-out 2 alternate both;
        }

        @keyframes scyraDotBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }

        .scyra-scroll {
          scrollbar-width: thin;
          scrollbar-color: #d6d3d1 transparent;
        }
        .scyra-scroll::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .scyra-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .scyra-scroll::-webkit-scrollbar-thumb {
          background-color: #d6d3d1;
          border-radius: 9999px;
        }
        .scyra-scroll:hover::-webkit-scrollbar-thumb {
          background-color: #78716c;
        }
        .scyra-scroll:hover {
          scrollbar-color: #78716c transparent;
        }
        .scyra-scroll::-webkit-scrollbar-button {
          display: none;
          height: 0;
          width: 0;
        }

        .scyra-list {
          list-style: none;
          padding-left: 1.5rem;
        }
        .scyra-list li {
          position: relative;
          padding-left: 0.5rem;
          margin-bottom: 0.375rem;
        }
        .scyra-list li:last-child {
          margin-bottom: 0;
        }
        .scyra-list li::before {
          content: "•";
          position: absolute;
          left: -1.2rem;
          font-weight: 700;
          font-size: 1.2em;
          color: #1a1a1a;
        }
        .scyra-list + .scyra-list,
        .scyra-list + ol,
        ol + .scyra-list,
        ol + ol {
          margin-top: -0.75rem;
        }
      `}</style>

      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarManuallyCollapsed((c) => !c)}
        onNewScan={handleNewScan}
        onSelectType={handleActionClick}
        user={user}
        userLoading={userLoading}
        onLogout={handleLogout}
        onOpenModal={setActiveModal}
        history={displayHistory}
        historyLoading={historyLoading}
        activeId={activeScanId}
        onSelectHistory={handleSelectHistory}
        onHistoryShare={handleHistoryShare}
        onHistoryPin={handleHistoryPinToggle}
        onHistoryRename={handleHistoryRename}
        onHistoryDelete={handleRequestHistoryDelete}
        onHistoryViewDocument={handleHistoryViewDocument}
        onHistoryViewPresentation={handleHistoryViewPresentation}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        onOpenPanelFullScreen={() => {}}
      />

      {!panelFullScreen && !(isMobile && panelOpen) && (
        <div
          className={`flex flex-col min-w-0 min-h-0 ${MAIN_COLUMN_BG} transition-all duration-300 ease-in-out ${
            panelOpen ? 'md:w-[50vw] flex-1' : 'flex-1'
          }`}
        >
          {headerBar}

          {!hasStartedConversation ? (
            <div className="relative flex-1 min-h-0 flex flex-col">
              <div className="relative z-10 flex-1 min-h-0 overflow-y-auto scyra-scroll flex flex-col items-center px-3 sm:px-5 md:px-6 md:justify-center md:pb-[10vh]">
                <div className="w-full max-w-3xl flex-1 md:flex-none flex flex-col items-center justify-center">
                  <div
                    className={`flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4 text-center transition-opacity duration-300 ease-out ${
                      greetingReady ? 'opacity-100' : 'opacity-0'
                    }`}
                    aria-busy={!greetingReady}
                  >
                    <img
                      src={LOGO_SRC}
                      alt={LOGO_ALT}
                      className="w-11 h-11 object-contain flex-shrink-0 select-none pointer-events-none"
                      draggable={false}
                    />
                    <h1
                      className="text-[24px] sm:text-[30px] md:text-[36px] leading-tight tracking-tight font-normal text-stone-900 min-h-[38px] break-words"
                      style={{ fontFamily: FONT_HEADING }}
                    >
                      {greeting || ' '}
                    </h1>
                  </div>
                </div>
                <div className="w-full max-w-3xl mt-3 md:mt-6">{suggestionsList}</div>
                <div className="w-full max-w-3xl mt-3 md:mt-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:pb-0">
                  {renderInputBox('home')}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 min-h-0 relative overflow-hidden">
                <div
                  ref={scrollContainerRef}
                  className="absolute inset-x-0 top-0 bottom-0 overflow-y-auto scyra-scroll"
                >
                  {switchingHistory ? (
                    <ChatSwitchSkeleton />
                  ) : (
                    <div className="px-3 sm:px-5 pt-2" style={{ paddingBottom: isMobile ? inputBarH + 12 : 40 }}>
                      <div className="max-w-3xl mx-auto space-y-5 sm:space-y-6">
                        {/* Earlier general chat (before the scan) — always stays on screen */}
                        {preMessages.map((turn, i) =>
                          turn.role === 'user' ? (
                            <FollowUpUserBubble
                              key={`pre-${i}`}
                              content={turn.content}
                              onCopy={() => {}}
                              onEdit={() => handleEditFollowUp(turn.content)}
                            />
                          ) : (
                            <FollowUpAiBubble
                              key={`pre-${i}`}
                              content={turn.content}
                              streaming={false}
                              onSuggestionClick={handleSuggestionClick}
                            />
                          )
                        )}

                        {contextInputContent && (loading || contextResult || errorCode) && (
                          <UserMessage
                            content={contextInputContent}
                            inputType={(contextInputType as InputType) ?? 'text'}
                            onEdit={handleEditUserMessage}
                            onRetry={handleRetry}
                          />
                        )}

                        {loading && (
                          <div ref={progressRef} className="flex items-start">
                            <ThinkingBlock
                              steps={
                                thinkingSteps.length > 0
                                  ? [...thinkingSteps, 'Preparing your report']
                                  : [READING_STEP[(contextInputType as InputType) ?? inputType]]
                              }
                            />
                          </div>
                        )}

                        {errorCode && !loading && (
                          <ErrorCard
                            code={errorCode}
                            onRetry={handleRetry}
                            onDismiss={() => setErrorCode(null)}
                            onSecondary={
                              errorCode === 'timeout' || errorCode === 'offline' ? handleNewScan : undefined
                            }
                          />
                        )}

                        {contextResult && !loading && (
                          <div ref={resultRef}>
                            <AiResultMessage
                              result={contextResult as ScamResultWithFindings}
                              onOpenReport={handleOpenDocumentReport}
                              onOpenPresentation={handleOpenPresentationReport}
                              onRetry={handleRetry}
                              activePanelMode={panelOpen ? panelMode : null}
                            />
                          </div>
                        )}

                        {!loading && followUpMessages.map((turn, i) =>
                          turn.role === 'user' ? (
                            <FollowUpUserBubble
                              key={i}
                              content={turn.content}
                              onCopy={() => {}}
                              onEdit={() => handleEditFollowUp(turn.content)}
                              onRetry={() => void handleFollowUpSend(turn.content)}
                            />
                          ) : (
                            <FollowUpAiBubble
                              key={i}
                              content={turn.content}
                              suggestions={turn.suggestions}
                              streaming={turn.streaming || false}
                              onSuggestionClick={handleSuggestionClick}
                              onRetry={() => {
                                const prevUser = followUpMessages[i - 1];
                                if (prevUser && prevUser.role === 'user') {
                                  void handleFollowUpSend(prevUser.content);
                                }
                              }}
                            />
                          )
                        )}

                        {isMobile && showDisclaimer && (
                          <p
                            className="text-center text-[13px] text-stone-400 pt-3 pb-1"
                            style={{ fontFamily: FONT_BODY }}
                          >
                            Custos AI can make mistakes. Double-check important results.
                          </p>
                        )}

                        <div ref={chatEndRef} style={isMobile ? { scrollMarginBottom: inputBarH + 12 } : undefined} />
                      </div>
                    </div>
                  )}
                </div>

                {/* PHONE ONLY — floating input: chat scrolls under it and stays visible (lightly blurred) below it */}
                {isMobile && (
                  <div className="absolute inset-x-0 bottom-0 z-20 pointer-events-none">
                    <div
                      aria-hidden
                      className="absolute inset-0 backdrop-blur-[1px] bg-[#FCFCFC]/10"
                      style={{
                        WebkitMaskImage: 'linear-gradient(to top, #000 62%, transparent)',
                        maskImage: 'linear-gradient(to top, #000 62%, transparent)',
                      }}
                    />
                    <div
                      ref={inputBarRef}
                      className="relative px-3 sm:px-5 pt-6 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
                    >
                      <div className="max-w-3xl mx-auto pointer-events-auto">
                        {renderInputBox('chat')}
                        {shake && (
                          <p className="text-[13px] text-red-500 mt-2 ml-3 font-medium">Please type or paste something to scan.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* DESKTOP — original layout: input fixed under the chat, note below it */}
              {!isMobile && (
                <div className="flex-shrink-0 px-3 sm:px-5 md:px-6 pb-[max(1rem,env(safe-area-inset-bottom))] bg-transparent">
                  <div className="max-w-3xl mx-auto">
                    {renderInputBox('chat')}
                    {shake && (
                      <p className="text-[13px] text-red-500 mt-2 ml-3 font-medium">Please type or paste something to scan.</p>
                    )}
                    <p className="text-center text-[12px] text-stone-400 mt-2.5" style={{ fontFamily: FONT_BODY }}>
                      Custos AI can make mistakes. Double-check important results.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <ReportPanel
        open={panelOpen}
        fullScreen={panelFullScreen}
        mode={panelMode}
        result={contextResult as ScamResultWithFindings | null}
        inputContent={contextInputContent}
        inputType={contextInputType}
        onClose={handleClosePanel}
        onToggleFullScreen={handleToggleFullScreen}
        onDownload={handleDownloadReport}
        isMobile={isMobile}
        onOpenMobileMenu={() => setMobileSidebarOpen(true)}
      />

      {pendingScan && (
        <NewScanConfirmModal
          contentLabel={NEW_CONTENT_TYPE_LABEL[pendingScan.type]}
          onConfirm={handleConfirmPendingScan}
          onCancel={handleCancelPendingScan}
        />
      )}

      {renaming && isMobile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-[400px] p-6" style={{ fontFamily: FONT_BODY }}>
            <h4 className="text-[22px] font-medium text-stone-900 mb-5">Rename</h4>
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && renameValue.trim() && renameValue.trim() !== topHeaderLabel) handleRenameCommit();
                if (e.key === 'Escape') setRenaming(false);
              }}
              className="w-full text-[16px] text-stone-900 bg-white rounded-2xl px-4 py-3.5 outline-none border-2 border-blue-500"
            />
            <div className="grid grid-cols-2 gap-3 mt-5">
              <button
                onClick={() => setRenaming(false)}
                className="py-3 rounded-full text-[16px] font-medium text-stone-900 border border-stone-200 hover:bg-stone-50 active:bg-stone-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRenameCommit}
                disabled={!renameValue.trim() || renameValue.trim() === topHeaderLabel}
                className="py-3 rounded-full text-[16px] font-medium text-white bg-stone-900 hover:bg-black disabled:bg-stone-300 disabled:text-white/80 disabled:cursor-not-allowed transition-colors"
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <DeleteConfirmModal
          onCancel={() => setConfirmDeleteId(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

      <ProfileModal open={activeModal === 'profile'} onClose={() => setActiveModal(null)} user={user} />
      <UsageModal open={activeModal === 'usage'} onClose={() => setActiveModal(null)} />
      <SettingsModal
        open={activeModal === 'settings'}
        onClose={() => setActiveModal(null)}
        user={user}
        onLogout={handleLogout}
      />
      <FeedbackModal open={activeModal === 'feedback'} onClose={() => setActiveModal(null)} />
      <BugReportModal open={activeModal === 'bug'} onClose={() => setActiveModal(null)} />
      <ShortcutsModal open={activeModal === 'shortcuts'} onClose={() => setActiveModal(null)} />
      </div>
    </div>
  );
};

export default MainArea;