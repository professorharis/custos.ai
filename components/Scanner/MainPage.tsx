'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowUp, Menu, Pin, Share2, Square } from 'lucide-react';
import type { ScamResult } from '@/lib/types';
import { useScanResult } from '@/context/ScanResultContext';
import { getContextLabels, getRiskLevelLabel } from '@/lib/scannerHelpers';
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
  MobileChatHeaderMenu,
  NewScanConfirmModal,
  ScanStepFlow,
  UserMessage,
} from './ChatArea';
import {
  CHECKLIST_STEPS,
  FONT_BODY,
  FONT_HEADING,
  FOLLOWUP_PLACEHOLDER,
  INPUT_PLACEHOLDER,
  NEW_CONTENT_TYPE_LABEL,
  QUICK_ACTIONS,
  SAMPLE_SENTENCES,
  TYPE_HEADER_LABEL,
  detectInputType,
  getMessageTypography,
  isSameContent,
  looksLikeNewScanContent,
  type FollowUpMessage,
  type InputType,
  type ScamResultWithFindings,
} from './types';

// ─────────────────────────────────────────────────────────────────────────
// The shared `FollowUpMessage` type (./types) describes what gets PERSISTED
// to Supabase (role, content, suggestions). The transient `streaming` flag
// only exists in-memory while an assistant bubble is actively streaming —
// it should never be written to storage. So instead of polluting the
// shared/stored shape by adding `streaming` there, we extend it locally.
// This is the type the live `followUpMessages` state array uses.
// ─────────────────────────────────────────────────────────────────────────
type LiveFollowUpMessage = FollowUpMessage & { streaming?: boolean };

// Quick-suggestions (fallback — used only if the AI didn't send its own
// contextual suggestions alongside a redirect message; see handleFollowUpSend)
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

const PAGE_WASH_BG = 'bg-[#F7F6F3]';
const MAIN_COLUMN_BG = 'bg-[#F7F6F3]';

// How close (in px) to the bottom of the scroll container counts as
// "already at the bottom" — only then do we auto-scroll on new streamed content.
const AUTO_SCROLL_THRESHOLD_PX = 120;

// Minimum time (ms) the "switching history" skeleton stays visible for.
// Without a floor like this, a fast state update can flip the skeleton
// on and off within the same frame, making it look like it never showed
// at all — so we always hold it for at least this long.
const HISTORY_SWITCH_SKELETON_MS = 380;

// Small delay (ms) used when a pending "new scan" is confirmed from the
// follow-up flow — lets the hero/home screen actually flash into view for
// a beat before the new scan kicks off, instead of jumping straight past it.
const NEW_SCAN_HOME_FLASH_MS = 220;

// How long a fetch is allowed to run before we treat it as timed out and
// show the "Request timed out" card instead of hanging indefinitely.
const REQUEST_TIMEOUT_MS = 35000;

const WELCOME_HEADLINES: { title: string; subtitle: string }[] = [
  {
    title: 'Custos AI Security Scanner',
    subtitle: "Paste a message, SMS, email, or link — we'll check it for scams, phishing, and fraud in seconds.",
  },
  {
    title: 'What are we checking today?',
    subtitle: 'Paste a message, SMS, email, or link and get an instant risk breakdown.',
  },
  {
    title: 'Stay one step ahead of scammers',
    subtitle: "Drop in any text, email, or link — we'll flag anything suspicious in seconds.",
  },
  {
    title: 'Scan first, trust later',
    subtitle: 'Paste a message, SMS, email, or link to see how safe it really is.',
  },
];

// Rebuilds the `details` JSON blob that gets saved into the `scans` table,
// merging in whatever follow-up thread should be persisted alongside it.
// Centralized here so runScan's initial insert and handleFollowUpSend's
// later updates always shape this object the same way.
function buildScanDetails(result: ScamResultWithFindings | null, followUps: FollowUpMessage[]) {
  return {
    explanation: result?.explanation ?? '',
    safetyTips: result?.safetyTips ?? [],
    scanId: result?.scanId,
    findings: result?.findings ?? [],
    recommendation: result?.recommendation ?? null,
    // Follow-up Q&A thread travels with the scan record so it survives a
    // refresh or switching to another history item and back. Assistant
    // turns are saved with streaming cleared/omitted.
    followUps: followUps.map((f) => ({ role: f.role, content: f.content, suggestions: f.suggestions })),
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Builds a specific, content-aware title for a scan instead of a generic
// "Text/Email/SMS/URL Scan Analysis" label — used as the fallback whenever
// the AI-generated title (from /api/generate-title) isn't available yet,
// failed, or wasn't saved on an older row.
//   - url   -> "paypal-secure.com Link Analysis"
//   - email -> subject line or sender, e.g. "Account Verification — Email Analysis"
//   - sms/text -> first few words of the message, e.g. "Your account has been… — SMS Analysis"
// Always falls back to the generic TYPE_HEADER_LABEL if nothing usable is found.
// ─────────────────────────────────────────────────────────────────────────
function deriveFallbackTitle(content: string, type: InputType): string {
  const trimmed = (content || '').trim();
  if (!trimmed) return TYPE_HEADER_LABEL[type];

  if (type === 'url') {
    const match = trimmed.match(/https?:\/\/[^\s]+/)?.[0] ?? trimmed;
    try {
      const withProtocol = match.startsWith('http') ? match : `https://${match}`;
      const u = new URL(withProtocol);
      const host = u.hostname.replace(/^www\./, '');
      return `${host} Link Analysis`;
    } catch {
      return 'Suspicious Link Analysis';
    }
  }

  if (type === 'email') {
    const subject = trimmed.match(/subject:\s*(.+)/i)?.[1]?.trim();
    const from = trimmed.match(/from:\s*([^\n<]+)/i)?.[1]?.trim();
    if (subject) {
      const clipped = subject.length > 42 ? `${subject.slice(0, 42)}…` : subject;
      return `${clipped} — Email Analysis`;
    }
    if (from) {
      const clipped = from.length > 32 ? `${from.slice(0, 32)}…` : from;
      return `${clipped} Email Analysis`;
    }
    return 'Email Security Analysis';
  }

  const words = trimmed.replace(/\s+/g, ' ').split(' ');
  const preview = words.slice(0, 6).join(' ');
  const suffix = type === 'sms' ? 'SMS Analysis' : 'Text Analysis';
  if (!preview) return TYPE_HEADER_LABEL[type];
  return `${preview}${words.length > 6 ? '…' : ''} — ${suffix}`;
}

// ─────────────────────────────────────────────────────────────────────────
// Skeleton shown briefly while switching between history items — mirrors
// the actual layout (user bubble + AI response lines) so the swap feels
// like a real loading state instead of an unexplained blur.
// ─────────────────────────────────────────────────────────────────────────
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
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  // Replaces the old raw `error: string | null`. We only ever store a
  // known ErrorCode — never a provider/server error string — so the UI
  // can only ever render pre-written, premium copy (see ErrorCard.tsx).
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  // Shows the ChatGPT-style red top banner when the browser goes offline.
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  const [demoText, setDemoText] = useState('');
  const [isTypingDemo, setIsTypingDemo] = useState(false);
  const [shake, setShake] = useState(false);
  const [user, setUser] = useState<any>(null);
  // Distinct from `user === null` (meaning "not logged in"). Lets the
  // sidebar show an avatar skeleton instead of nothing while auth resolves.
  const [userLoading, setUserLoading] = useState(true);

  // IMPORTANT: never pick the random headline during the initial render.
  // Picking it in useState(() => ...) makes the server render one random
  // headline and the client render a *different* random one on first
  // paint — a guaranteed hydration mismatch, which forces React to
  // discard the whole SSR-ed tree and re-render everything from scratch
  // on the client. That full remount is exactly the "thin heading ->
  // flashes to something else" glitch. Fix: render the same fixed
  // headline on both server and first client pass, then swap to a random
  // one in an effect (client-only, after hydration is already done, so
  // no mismatch is possible).
  const [welcomeCopy, setWelcomeCopy] = useState(WELCOME_HEADLINES[0]);
  useEffect(() => {
    setWelcomeCopy(WELCOME_HEADLINES[Math.floor(Math.random() * WELCOME_HEADLINES.length)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [followUpMessages, setFollowUpMessages] = useState<LiveFollowUpMessage[]>([]);
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [pendingScan, setPendingScan] = useState<{ text: string; type: InputType } | null>(null);
  // Index of the message currently being streamed (so we can update it)
  const [streamingIndex, setStreamingIndex] = useState<number | null>(null);

  // `historyLoading` below comes from useScanHistory and should only ever
  // be true on first mount / manual refresh — NOT when the user simply
  // clicks a different item in the list. Selecting a history item (see
  // handleSelectHistory) never calls `refreshHistory()`, so the sidebar
  // itself won't re-enter its skeleton state on every click. If it still
  // does in your app, check inside useScanHistory.ts for any effect that
  // re-fires `loading` on selection rather than only on refresh/mount.
  const {
    history: displayHistory,
    loading: historyLoading,
    refresh: refreshHistory,
    pinToggle: handleHistoryPinToggle,
    rename: handleHistoryRename,
    softDelete: handleHistoryDeleteRaw,
  } = useScanHistory(8);

  const hasStartedConversation = loading || !!contextResult || !!errorCode;
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

  // Id of the history item pending a delete confirmation. When set,
  // <DeleteConfirmModal> is shown; the actual delete only happens on confirm.
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Brief loading/skeleton state while switching between history items,
  // so the chat area doesn't just snap/flicker straight to new content.
  const [switchingHistory, setSwitchingHistory] = useState(false);
  const switchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Timer used when confirming a "new scan" from inside a follow-up thread —
  // lets the home/hero screen show briefly before the scan actually starts.
  const newScanFlashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Shows the top red banner the instant the browser reports the network
  // is gone, and clears it automatically when connectivity returns —
  // mirrors the ChatGPT-style "You're offline" banner.
  useEffect(() => {
    const handleOffline = () => setShowOfflineBanner(true);
    const handleOnline = () => setShowOfflineBanner(false);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    // In case we mount while already offline.
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
  // Separate abort controller for the follow-up chat stream, so stopping a
  // follow-up answer never touches the main scan's in-flight request.
  const followUpAbortRef = useRef<AbortController | null>(null);
  const typeIndexRef = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const hasAutoScrolledRef = useRef(false);

  // ─── Streaming batching refs ───────────────────────────────────────────
  // Streamed text is buffered here and flushed to React state at most once
  // per animation frame, so fast token streams don't cause jerky re-renders.
  const pendingContentRef = useRef<string>('');
  const rafHandleRef = useRef<number | null>(null);
  const assistantIndexRef = useRef<number>(-1);
  // Tracks suggestion chips for the in-flight assistant turn (redirect case)
  // so they can be persisted to Supabase once streaming finishes.
  const pendingSuggestionsRef = useRef<string[] | undefined>(undefined);

  // Grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }, [message, panelOpen]);

  // Fetch user
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

  // NOTE — the old effect that called `refreshHistory()` on every
  // `contextResult` change has been removed. It fired on history switches
  // too (not just fresh scans), which re-triggered the sidebar's loading
  // state and caused the white skeleton flash. `runScan` already calls
  // `refreshHistory()` itself right after a new scan is saved, so nothing
  // is lost — the sidebar simply no longer refreshes on unrelated renders.

  // Scroll to progress when loading starts
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

  // When the report finishes generating, bring its TOP into view instead of
  // jumping straight to the bottom of the page. The report's findings/summary
  // reveal with a staggered fade-in animation, so snapping to the very end
  // immediately would skip past that animation and feel jarring. Scrolling
  // to the start of the report lets the user read it in from the top, the
  // same way the "scanning progress" view is brought into place above.
  useEffect(() => {
    if (!loading && contextResult) {
      requestAnimationFrame(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [loading, contextResult]);

  // Auto-scroll for follow-up thread — only when a new message is appended
  // (not on every streamed chunk, which is handled separately + conditionally below)
  useEffect(() => {
    if (followUpMessages.length === 0) return;
    requestAnimationFrame(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  }, [followUpMessages.length, followUpLoading]);

  // Clear any pending timeouts on unmount.
  useEffect(() => {
    return () => {
      if (switchTimeoutRef.current) clearTimeout(switchTimeoutRef.current);
      if (newScanFlashTimeoutRef.current) clearTimeout(newScanFlashTimeoutRef.current);
    };
  }, []);

  // Returns true if the user is already scrolled near the bottom of the
  // conversation — used to decide whether streamed content should auto-scroll.
  const isNearBottom = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < AUTO_SCROLL_THRESHOLD_PX;
  }, []);

  const getLabel = useCallback(() => {
    switch (inputType) {
      case 'sms': return 'SMS Content';
      case 'email': return 'Email Payload';
      case 'url': return 'Target URL';
      default: return 'Text Document';
    }
  }, [inputType]);

  const getShortLabel = useCallback(() => {
    switch (inputType) {
      case 'sms': return 'SMS';
      case 'email': return 'Email';
      case 'url': return 'URL';
      default: return 'Text';
    }
  }, [inputType]);

  const ActiveIcon = QUICK_ACTIONS.find((a) => a.id === inputType)?.icon ?? QUICK_ACTIONS[0].icon;

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

  const handleActionClick = useCallback(
    (type: InputType) => {
      setInputType(type);
      setErrorCode(null);
      setMessage('');
      runGhostTypewriter(SAMPLE_SENTENCES[type]);
      textareaRef.current?.focus();
    },
    [runGhostTypewriter]
  );

  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
      abortControllerRef.current?.abort();
      followUpAbortRef.current?.abort();
      if (rafHandleRef.current !== null) cancelAnimationFrame(rafHandleRef.current);
    };
  }, []);

  const hasContent = message.trim().length > 0;

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
    setCustomTitle(null);
    setPinned(false);
    setActiveScanId(null);
    setFollowUpMessages([]);
    setFollowUpLoading(false);
    setPendingScan(null);
    setStreamingIndex(null);

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Belt-and-braces client-side timeout in addition to the server's own
    // AbortSignal.timeout — guarantees the UI never hangs indefinitely
    // even if the network layer itself stalls before reaching our server.
    const timeoutId = setTimeout(() => controller.abort('timeout'), REQUEST_TIMEOUT_MS);

    setLoading(true);
    setErrorCode(null);
    setContextResult(null);
    setContextInputContent(finalContent);
    setContextInputType(type);
    setMessage('');

    const minDuration = (CHECKLIST_STEPS[type]?.length ?? 6) * 450 + 1200;
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
        // Server only ever sends a `code` — never a raw provider message —
        // so we can only ever render pre-written, premium copy.
        const errData = await res.json().catch(() => ({}));
        setErrorCode(extractErrorCode(errData));
        return;
      }

      const data = (await res.json()) as ScamResultWithFindings;
      const scanId = `#SCY-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;
      const scanResult: ScamResultWithFindings = { ...data, scanId };

      const elapsed = Date.now() - startedAt;
      if (elapsed < minDuration) {
        await new Promise((resolve) => setTimeout(resolve, minDuration - elapsed));
      }
      if (controller.signal.aborted) return;

      setContextResult(scanResult);

      // Ask for a short, professional, AI-generated title for this scan
      // (e.g. "HBL Account Verification Scam") instead of always falling
      // back to a generic label. Best-effort: if it fails or times out we
      // fall back to `deriveFallbackTitle`, which still produces a
      // content-specific title (domain name, subject line, or message
      // preview) rather than a plain "Text/Email/SMS/URL Scan Analysis".
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
          aiTitle = titleData.title ?? null;
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
              // Specific, content-aware title (AI-generated, or a
              // deterministic fallback) so the sidebar/header never shows
              // a generic, unrelated label.
              title: resolvedTitle,
              content: finalContent,
              risk_level: scanResult.riskLevel === 'high' ? 'High' : scanResult.riskLevel === 'medium' ? 'Medium' : 'Low',
              risk_score: scanResult.riskScore,
              is_scam: scanResult.riskLevel !== 'low',
              details: buildScanDetails(scanResult, []),
            })
            .select('id')
            .single();
          if (saveError) throw saveError;
          if (savedRow) setActiveScanId(savedRow.id);
          refreshHistory();
        }
      } catch (dbError) {
        // Saving history is best-effort — the report itself already
        // rendered successfully, so we log this quietly rather than
        // surfacing an error card over a working result.
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
      if (err instanceof Error && err.name === 'AbortError') {
        // Distinguish our own client-side timeout abort from a genuine
        // user-initiated cancel (there's no cancel button on the initial
        // scan today, so in practice this branch is our timeout).
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
      if (abortControllerRef.current === controller) {
        setLoading(false);
      }
    }
  }, [stopGhostScene, setContextResult, setContextInputContent, setContextInputType, onScan, refreshHistory]);

  // ─── Follow‑up with streaming ─────────────────────────────────────────
  const handleFollowUpSend = useCallback(async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || !contextResult) return;

    // Add user message
    const userTurn: FollowUpMessage = { role: 'user', content: trimmed };
    setFollowUpMessages((prev) => [...prev, userTurn]);

    // Create placeholder assistant message
    const assistantIndex = followUpMessages.length + 1; // after user and previous messages
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

    // Abort controller for THIS follow-up turn — lets the stop button
    // cancel just the in-flight answer without touching a fresh scan.
    followUpAbortRef.current?.abort();
    const controller = new AbortController();
    followUpAbortRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort('timeout'), REQUEST_TIMEOUT_MS);

    // Persists the completed follow-up turn (user question + assistant
    // answer) into the scan row's `details.followUps`, so refreshing the
    // page or switching to another history item and back doesn't lose it.
    const persistFollowUp = (assistantContent: string, suggestions?: string[]) => {
      if (!activeScanId) return; // guest / not-yet-saved scan — nothing to persist to
      const finalThread: FollowUpMessage[] = [
        ...followUpMessages,
        userTurn,
        { role: 'assistant', content: assistantContent, suggestions },
      ];
      supabase
        .from('scans')
        .update({ details: buildScanDetails(contextResult, finalThread) })
        .eq('id', activeScanId)
        .then(({ error }) => {
          if (error) console.error('Failed to save follow-up:', error);
        });
    };

    // Sets a graceful, on-brand fallback message on the assistant bubble
    // in place of a raw error — used for stream failures / timeouts.
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

    // Flushes the buffered streamed text into React state — throttled to
    // at most once per animation frame for smooth, non-jerky rendering.
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
          history: followUpMessages,
          context: {
            inputContent: contextInputContent,
            inputType: contextInputType,
            result: contextResult,
          },
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        // Same code-only contract as the main scan endpoint.
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
              // First redirect event carries the initial redirect message text.
              // If the backend provided its own contextual suggestions
              // (data.suggestions), use those; otherwise fall back to the
              // generic REDIRECT_SUGGESTIONS list.
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
              // Model kept streaming more of the redirect message after the marker.
              accumulated += data.content;
              pendingContentRef.current = accumulated;
              scheduleFlush();
            } else if (data.type === 'stream_error') {
              // Upstream connection dropped mid-stream — keep whatever
              // partial text streamed in, but stop cleanly instead of
              // leaving the bubble stuck on "streaming" forever.
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
              // Finalize — flush anything pending immediately, then clear streaming flag.
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
              // Save the completed turn once streaming is fully done.
              persistFollowUp(finalContent, pendingSuggestionsRef.current);
            }
          } catch (e) {
            // ignore parse errors
          }
        }
      }
    } catch (err) {
      // User pressed the stop button — the partial answer already shown
      // (via flushPending) is kept as-is; no error bubble, no overwrite.
      if (err instanceof DOMException && err.name === 'AbortError') {
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

  // Stops an in-flight follow-up stream (called from the send button when
  // it's showing the "stop" square) — cancels the fetch, freezes whatever
  // text has streamed in so far, and clears the loading/streaming flags.
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

  // ─── New-scan confirmation from inside a follow-up thread ─────────────
  // Cancel: nothing is sent, nothing is discarded from the scan/report —
  //   the composer is simply left empty (see handleCancelPendingScan).
  // Confirm: fully resets back to the home/hero screen first (so the user
  //   visibly sees the welcome screen + quick actions), then a moment
  //   later kicks off the new scan with the text they typed.
  const handleConfirmPendingScan = useCallback(() => {
    if (!pendingScan) return;
    const { text, type } = pendingScan;
    setPendingScan(null);

    if (newScanFlashTimeoutRef.current) clearTimeout(newScanFlashTimeoutRef.current);

    // Full reset -> hero headline + quick action buttons become visible.
    setContextResult(null);
    setContextInputContent('');
    setPanelOpen(false);
    setPanelFullScreen(false);
    stopGhostScene();
    setErrorCode(null);
    setLoading(false);
    setCustomTitle(null);
    setPinned(false);
    setActiveScanId(null);
    setFollowUpMessages([]);
    setFollowUpLoading(false);
    setStreamingIndex(null);
    setInputType(type);
    setMessage('');

    // Give the home screen a brief moment on screen before the new scan
    // takes over and the chat/progress view replaces it.
    newScanFlashTimeoutRef.current = setTimeout(() => {
      void runScan(text, type);
    }, NEW_SCAN_HOME_FLASH_MS);
  }, [pendingScan, runScan, stopGhostScene, setContextResult, setContextInputContent]);

  const handleCancelPendingScan = useCallback(() => {
    // Just dismiss the modal — the typed content was already cleared from
    // the composer when the modal was raised (see handleScan below), and
    // nothing has been sent or discarded from the active report/thread.
    setPendingScan(null);
  }, []);

  // True while a follow-up answer is actively streaming — drives the send
  // button switching from an up-arrow into a stop square.
  const isFollowUpBusy = followUpLoading && isFollowUpMode;

  const handleScan = useCallback(() => {
    const trimmed = message.trim();
    if (!trimmed) {
      setShake(true);
      setTimeout(() => setShake(false), 600);
      textareaRef.current?.focus();
      return;
    }

    if (isFollowUpMode) {
      if (isSameContent(trimmed, contextInputContent)) {
        setMessage('');
        void runScan(trimmed, (contextInputType as InputType) ?? inputType);
        return;
      }
      if (looksLikeNewScanContent(trimmed)) {
        setMessage('');
        setPendingScan({ text: trimmed, type: detectInputType(trimmed) });
        return;
      }
      setMessage('');
      void handleFollowUpSend(trimmed);
      return;
    }

    void runScan(trimmed, inputType);
  }, [message, isFollowUpMode, contextInputContent, contextInputType, inputType, runScan, handleFollowUpSend]);

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
    setCustomTitle(null);
    setPinned(false);
    setActiveScanId(null);
    setFollowUpMessages([]);
    setFollowUpLoading(false);
    setPendingScan(null);
    setStreamingIndex(null);
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

  // Edit a follow-up question: load it back into the composer for editing/resending.
  const handleEditFollowUp = useCallback((content: string) => {
    setMessage(content);
    textareaRef.current?.focus();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = '/';
  };

  // Wrapped with a `switchingHistory` flag, held for a fixed minimum
  // duration (HISTORY_SWITCH_SKELETON_MS) so the skeleton is actually
  // visible for a beat instead of flashing on/off within the same frame.
  // Also restores the persisted follow-up thread (details.followUps)
  // instead of always clearing it to [].
  //
  // Deliberately does NOT call refreshHistory() or touch anything that
  // would flip the sidebar's own `historyLoading` — selecting an item you
  // can already see in the list should never make the list itself reload.
  const handleSelectHistory = useCallback((id: string) => {
    const entry = displayHistory.find((h) => h.id === id);
    if (!entry) return;

    if (switchTimeoutRef.current) clearTimeout(switchTimeoutRef.current);
    setSwitchingHistory(true);

    const row = entry.raw;
    const details = row.details ?? {};
    const resolvedType = (row.type ?? 'Text').toString().toLowerCase() as InputType;
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
      scanId: details.scanId ?? row.id,
    } as any);
    setErrorCode(null);
    setPanelOpen(false);
    setPanelFullScreen(false);
    // Specific title: saved title first, then a content-aware fallback —
    // never the plain generic "Text/Email/SMS/URL Scan Analysis" label.
    setCustomTitle(row.title ?? deriveFallbackTitle(resolvedContent, resolvedType));
    setPinned(!!row.pinned);
    setActiveScanId(row.id);
    // Restore the saved follow-up thread instead of wiping it. Persisted
    // records never carry `streaming`, so we explicitly reset it to false
    // on restore — the extended local type makes the mapped result valid.
    setFollowUpMessages(
      ((details.followUps ?? []) as LiveFollowUpMessage[]).map((f) => ({ ...f, streaming: false }))
    );
    setFollowUpLoading(false);
    setPendingScan(null);
    setStreamingIndex(null);

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
        // Final arg is `GeneratePdfReportOptions` (not a boolean flag).
        // Passing an empty object uses the function's defaults — same
        // behaviour as ReportViewerModal's download.
        {}
      );
    } catch (err) {
      console.error('PDF download failed:', err);
    }
  }, [contextResult, contextInputContent, contextInputType]);

  // Specific, content-aware header/history label — falls back through:
  // AI-generated custom title -> content-derived title -> generic label.
  const topHeaderLabel =
    customTitle ?? deriveFallbackTitle(contextInputContent, (contextInputType as InputType) ?? 'text');

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

  // Instead of deleting immediately, open the confirmation modal. The
  // actual delete happens in the modal's onConfirm below.
  const handleHeaderDelete = useCallback(() => {
    if (activeScanId) {
      setConfirmDeleteId(activeScanId);
    } else {
      // Nothing persisted yet (guest / unsaved) — nothing to confirm, just reset.
      handleNewScan();
    }
  }, [activeScanId, handleNewScan]);

  // Sidebar's per-item kebab "Delete" also routes through the same
  // confirmation modal rather than deleting on click.
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

  // ──────────────────────────── Input Box ──────────────────────────────
  const renderInputBox = (variant: 'home' | 'chat') => {
    const isHome = variant === 'home';
    const rounding = isHome ? 'rounded-[26px]' : 'rounded-2xl';
    const padTop = isHome ? 'pt-5' : panelOpen ? 'pt-2' : 'pt-2.5';
    const padBottom = isHome ? 'pb-1' : panelOpen ? 'pb-0.5' : 'pb-1';
    const minHeight = isHome ? 72 : (panelOpen ? 32 : 60);
    const textSize = isHome ? 'text-[15.5px] sm:text-[16px]' : 'text-[14.5px] sm:text-[15.5px]';
    // Chat-variant horizontal padding trimmed slightly on the right so the
    // composer doesn't create extra visual "resistance" right next to the
    // scrollbar thumb above it.
    const horizontalPad = isHome ? 'px-5 sm:px-6' : 'px-3 sm:px-3.5';
    const placeholderText = isHome ? INPUT_PLACEHOLDER : isFollowUpMode ? FOLLOWUP_PLACEHOLDER : INPUT_PLACEHOLDER;
    const typedTypography = getMessageTypography(message);

    // Only show the "stop" square in the chat composer — the home
    // composer can never have a follow-up in flight.
    const showStop = !isHome && isFollowUpBusy;

    return (
      <div
        className={`${shake ? 'scyra-shake' : ''} bg-white ${rounding} border shadow-sm overflow-hidden relative flex flex-col transition-all duration-200 ${
          shake ? 'border-red-300' : isHome ? 'border-black/10 focus-within:border-black/20' : 'border-black/10 focus-within:border-black/20'
        }`}
      >
        <div className="relative w-full">
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
            disabled={loading}
            className={`w-full bg-transparent ${horizontalPad} ${padTop} ${padBottom} border-none outline-none resize-none text-stone-800 placeholder:text-stone-400 ${textSize} leading-relaxed relative z-10 ${
              loading ? 'opacity-60 cursor-not-allowed' : ''
            }`}
            style={{ fontFamily: typedTypography.fontFamily, minHeight, maxHeight: 200, overflowY: 'auto' }}
          />
          {isTypingDemo && !message && !loading && (
            <div
              className={`absolute inset-0 pointer-events-none ${horizontalPad} ${padTop} ${padBottom} ${isHome ? 'text-[13.5px] sm:text-[16px]' : 'text-[12.5px] sm:text-[15.5px]'} leading-relaxed text-stone-400/80 z-0 select-none whitespace-pre-wrap`}
              style={{ fontFamily: FONT_BODY }}
            >
              {demoText}
              <span className="animate-pulse font-semibold text-[#C65B39] ml-0.5">|</span>
            </div>
          )}
        </div>

        <div className={`flex items-center justify-between ${isHome ? 'px-3.5 sm:px-4 pb-3 sm:pb-3.5 pt-1.5' : 'px-2 sm:px-3 pb-2 sm:pb-3 pt-1'}`}>
          <div className="flex items-center gap-1.5 px-1.5 sm:px-2 py-1 rounded-md text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wide text-stone-500 select-none">
            <ActiveIcon className="w-3 h-3 text-stone-400" />
            <span className="hidden sm:inline">{getLabel()}</span>
            <span className="sm:hidden">{getShortLabel()}</span>
          </div>
          <button
            onClick={() => (showStop ? handleStopFollowUp() : void handleScan())}
            disabled={loading || (!hasContent && !showStop)}
            title={loading ? 'Scanning…' : showStop ? 'Stop' : isFollowUpMode ? 'Send' : 'Scan'}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
              loading || showStop
                ? 'bg-blue-600 cursor-pointer shadow-sm'
                : hasContent
                ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-px'
                : 'bg-stone-200 cursor-not-allowed'
            }`}
          >
            {loading ? (
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
        </div>
      </div>
    );
  };

  const quickActionsRow = (
    <div className="flex flex-wrap justify-center gap-2">
      {QUICK_ACTIONS.map((action) => {
        const isActive = inputType === action.id;
        const Icon = action.icon;
        return (
          <button
            key={action.id}
            onClick={() => handleActionClick(action.id)}
            className={`flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full border text-[11.5px] sm:text-[12.5px] font-semibold transition-all duration-200 ${
              isActive
                ? 'border-black/10 bg-white text-stone-800 shadow-sm'
                : 'border-black/10 bg-white/60 text-stone-500 hover:bg-white hover:border-black/20'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#C65B39]' : 'opacity-60'}`} />
            {action.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="flex flex-col h-screen w-full">
      {/* ChatGPT-style top banner — shown only while the browser reports
          being offline. Dismissible; reappears automatically if the
          connection drops again, and clears itself once back online. */}
      {showOfflineBanner && (
        <ErrorBanner
          code="offline"
          onDismiss={() => setShowOfflineBanner(false)}
          onRetry={() => window.location.reload()}
        />
      )}

      <div className={`flex flex-1 min-h-0 w-full ${PAGE_WASH_BG} overflow-hidden`} style={{ fontFamily: FONT_BODY }}>
      <style jsx global>{`
        /* Only the script-specific fonts (Urdu/Devanagari, used for
           script-aware rendering of scanned message content) still load
           this way — DM Serif Display and Inter (heading/body) now come
           from next/font in layout.tsx, which preloads them before first
           paint and avoids any flash of fallback text. */
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

        /* Animated thinking dots shown while waiting for the first streamed token */
        @keyframes scyraDotBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }

        .scyra-scroll {
          scrollbar-width: thin;
          scrollbar-color: #d6d3d1 transparent;
          /* NOTE: scrollbar-gutter: stable was removed here — it reserved
             a fixed gutter that made the scrollbar thumb feel "sticky"/
             resistant right where it sits next to the input composer.
             Without it the scrollbar only appears when actually needed
             and drags freely all the way to the true bottom. */
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
        /* Scrollbar goes noticeably darker on hover, so it reads as an
           active/draggable control instead of a faint, easy-to-miss line. */
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

        /* Bold bullet lists */
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
        /* Collapses the gap when the AI's markdown output produces two
           back-to-back list blocks (e.g. each bullet emitted as its own
           tiny list, separated by a blank line) instead of one shared
           <ul>. Without this, each list's own top/bottom margin stacks
           with the next one's, producing the large gaps between bullets
           seen in follow-up answers. This rule makes consecutive lists
           read as one continuous list visually, regardless of how the
           markdown parser split them. */
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
          <div className={`md:hidden flex items-center justify-between gap-2 px-4 py-3 border-b border-black/10 flex-shrink-0 ${MAIN_COLUMN_BG}`}>
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                title="Open menu"
                className="p-1.5 -ml-1.5 rounded-lg text-stone-600 hover:bg-stone-100 transition-colors flex-shrink-0"
              >
                <Menu className="w-5 h-5" />
              </button>
              <span
                className="text-[15px] font-semibold text-stone-800 truncate"
                style={{ fontFamily: FONT_BODY }}
              >
                {hasStartedConversation ? topHeaderLabel : 'Custos AI'}
              </span>
              {hasStartedConversation && pinned && (
                <Pin className="w-3 h-3 text-blue-600 fill-blue-600 flex-shrink-0" />
              )}
            </div>
            {hasStartedConversation && (
              <MobileChatHeaderMenu
                onShare={handleHeaderShare}
                onPin={handlePinToggle}
                onDelete={handleHeaderDelete}
                onOpenDocument={handleOpenDocumentReport}
                onOpenPresentation={handleOpenPresentationReport}
                pinned={pinned}
              />
            )}
          </div>

          {!hasStartedConversation ? (
            <div className="flex-1 min-h-0 overflow-y-auto scyra-scroll flex flex-col items-center justify-center px-4 sm:px-5 py-10 sm:py-16">
              <div className="w-full max-w-3xl text-center mb-6">
                <h1
                  className="text-[28px] sm:text-[36px] font-light tracking-wide text-stone-800"
                  style={{ fontFamily: FONT_HEADING }}
                >
                  {welcomeCopy.title}
                </h1>
                <p className="text-stone-500 text-[13.5px] sm:text-[14px] mt-2 px-2" style={{ fontFamily: FONT_BODY }}>
                  {welcomeCopy.subtitle}
                </p>
              </div>
              <div className="w-full max-w-3xl">
                {renderInputBox('home')}
                <div className="mt-3">{quickActionsRow}</div>
              </div>
            </div>
          ) : (
            <>
              {/* Relative wrapper so the switchingHistory skeleton overlay can
                  sit exactly over the scrollable chat area (and nothing else). */}
              <div className="flex-1 min-h-0 relative overflow-hidden">
                <div
                  ref={scrollContainerRef}
                  className="absolute inset-x-0 top-0 bottom-0 overflow-y-auto scyra-scroll"
                >
                  <div className={`hidden md:flex sticky top-0 z-10 px-4 sm:px-5 py-3 items-center justify-between gap-1.5 ${MAIN_COLUMN_BG}`}>
                    <div className="flex items-center gap-1.5 min-w-0">
                      {renaming ? (
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onBlur={handleRenameCommit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameCommit();
                            if (e.key === 'Escape') setRenaming(false);
                          }}
                          className="text-[13.5px] sm:text-[14px] font-semibold text-stone-800 bg-white rounded-md px-2 py-0.5 outline-none border border-black/10 focus:border-black/20"
                          style={{ fontFamily: FONT_BODY }}
                        />
                      ) : (
                        <>
                          <span className="text-[13.5px] sm:text-[14px] font-semibold text-stone-800 truncate flex items-center gap-1.5" style={{ fontFamily: FONT_BODY }}>
                            {topHeaderLabel}
                            {pinned && <Pin className="w-3 h-3 text-blue-600 fill-blue-600" />}
                          </span>
                          <ChatHeaderMenu
                            onRename={handleRenameStart}
                            onPin={handlePinToggle}
                            onDelete={handleHeaderDelete}
                            onOpenDocument={handleOpenDocumentReport}
                            onOpenPresentation={handleOpenPresentationReport}
                            pinned={pinned}
                          />
                        </>
                      )}
                    </div>
                    {!renaming && (
                      // Share is a labeled text+icon button, not icon-only —
                      // easier to notice/tap, matches the mobile menu.
                      <button
                        onClick={handleHeaderShare}
                        title="Share"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-stone-500 hover:bg-stone-200/60 hover:text-stone-700 transition-colors flex-shrink-0 text-[12px] font-medium"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        Share
                      </button>
                    )}
                  </div>

                  {switchingHistory ? (
                    <ChatSwitchSkeleton />
                  ) : (
                    // Moderate bottom padding creates breathing room
                    // between the last message/bubble and the fixed input
                    // composer below, while still letting the scroll
                    // container reach its true bottom (bottom-0 on the
                    // wrapper above, no more bottom-4 cut-off). Keeping
                    // this value modest (rather than a very large one)
                    // avoids short conversations looking like the
                    // scrollbar "doesn't reach the bottom" — a big empty
                    // padding block below short content makes the thumb
                    // look short/stuck even though scrolling is correct.
                    <div className="px-4 sm:px-5 pt-4 pb-10">
                      <div className="max-w-3xl mx-auto space-y-6">
                        {contextInputContent && (loading || contextResult || errorCode) && (
                          <UserMessage
                            content={contextInputContent}
                            label={getContextLabels(contextInputType).scanTypeLabel}
                            inputType={(contextInputType as InputType) ?? 'text'}
                            onEdit={handleEditUserMessage}
                            onRetry={handleRetry}
                          />
                        )}

                        {loading && (
                          <div ref={progressRef} className="flex items-start">
                            <ScanStepFlow inputType={inputType} />
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

                        {contextResult && !loading && followUpMessages.map((turn, i) =>
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
                                // Retry: resend the same question
                                const prevUser = followUpMessages[i - 1];
                                if (prevUser && prevUser.role === 'user') {
                                  void handleFollowUpSend(prevUser.content);
                                }
                              }}
                            />
                          )
                        )}

                        <div ref={chatEndRef} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className={`flex-shrink-0 px-4 sm:px-5 pb-4 ${MAIN_COLUMN_BG}`}>
                <div className="max-w-3xl mx-auto">
                  {renderInputBox('chat')}
                  {shake && (
                    <p className="text-xs text-red-500 mt-2 ml-1 font-medium">Please type or paste something to scan.</p>
                  )}
                  <p className="text-center text-[10.5px] sm:text-[11px] text-stone-400 mt-3" style={{ fontFamily: FONT_BODY }}>
                    Custos AI can make mistakes. Double-check important results.
                  </p>
                </div>
              </div>
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

      {/* Delete now always asks for confirmation first (sidebar kebab menu
          and chat header both route here) instead of deleting instantly. */}
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