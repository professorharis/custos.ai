'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  ArrowRight,
  Check,
  ChevronDown,
  Circle,
  Copy,
  CornerDownRight,
  FileText,
  Lightbulb,
  Pencil,
  Pin,
  Play,
  RotateCcw,
  Share2,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import { getRiskColor, getRiskLevelLabel } from '@/lib/scannerHelpers';
import {
  CHECKLIST_STEPS,
  FONT_BODY,
  TYPE_ICON,
  formatRecommendation,
  getMessageTypography,
  pickRecommendationHeading,
  type InputType,
  type KeywordFinding,
  type ScamResultWithFindings,
} from './types';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ErrorCard } from '../ErrorCard';
import { classifyError, type ErrorCode, type ErrorAction } from '@/lib/errorTypes';

// ─────────────────────────────────────────────────────────────────────────
// Shared markdown renderer config
// ─────────────────────────────────────────────────────────────────────────
//
// NOTE: A paragraph whose ONLY content is a single **bold** run (e.g.
// "**What this means**" on its own line) is treated as a section-label
// and rendered as a clean, thin-bordered block heading instead of a plain
// bold sentence. This gives follow-up answers about the report / general
// cybersecurity topics a scannable, "card per section" structure.

function isSoleBoldParagraph(children: any): string | null {
  const arr = React.Children.toArray(children).filter((c) => {
    if (typeof c === 'string') return c.trim().length > 0;
    return true;
  });
  if (arr.length !== 1) return null;
  const only = arr[0];
  if (
    React.isValidElement(only) &&
    (only.type === 'strong' || (only.props as any)?.mdxType === 'strong')
  ) {
    const text = React.Children.toArray((only.props as any).children)
      .map((c) => (typeof c === 'string' ? c : ''))
      .join('');
    return text.trim() || null;
  }
  return null;
}

export const markdownComponents = {
  strong: ({ children }: any) => (
    <strong className="font-semibold text-gray-900">{children}</strong>
  ),
  em: ({ children }: any) => <em className="italic text-gray-800">{children}</em>,

  p: ({ children }: any) => {
    const label = isSoleBoldParagraph(children);
    if (label) {
      return (
        <div className="mt-4 mb-2 first:mt-0">
          <div className="inline-block border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50">
            <span className="text-[13.5px] font-semibold text-gray-900 tracking-tight">
              {label}
            </span>
          </div>
        </div>
      );
    }
    return <p className="mb-3 last:mb-0 leading-relaxed text-gray-800">{children}</p>;
  },

  ul: ({ children }: any) => (
    <ul className="list-disc pl-6 mb-4 space-y-1.5 marker:text-gray-800 text-gray-800">
      {children}
    </ul>
  ),
  ol: ({ children }: any) => (
    <ol className="pl-0 mb-4 space-y-2 list-none">
      {React.Children.map(children, (child, idx) => {
        if (!React.isValidElement(child)) return child;
        return React.cloneElement(child as any, { 'data-step-index': idx + 1 });
      })}
    </ol>
  ),

  li: ({ children, ...props }: any) => {
    const stepIndex = props['data-step-index'];
    if (stepIndex) {
      return (
        <li className="flex items-start gap-2.5 leading-relaxed [&>p]:m-0 [&>p]:block">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10.5px] font-bold flex items-center justify-center mt-[3px]">
            {stepIndex}
          </span>
          <span className="flex-1 min-w-0">{children}</span>
        </li>
      );
    }
    return (
      <li className="leading-relaxed [&>p]:m-0 [&>p]:block">{children}</li>
    );
  },

  blockquote: ({ children }: any) => (
    <blockquote className="border-l-[3px] border-gray-300 pl-4 py-1 my-4 text-gray-600 [&>p]:mb-0 [&>p]:leading-relaxed">
      {children}
    </blockquote>
  ),

  a: ({ href, children }: any) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 underline underline-offset-2 hover:text-blue-800 font-medium break-all"
    >
      {children}
    </a>
  ),

  h1: ({ children }: any) => (
    <p className="font-semibold text-gray-900 mb-2 mt-4 first:mt-0">{children}</p>
  ),
  h2: ({ children }: any) => (
    <p className="font-semibold text-gray-900 mb-2 mt-4 first:mt-0">{children}</p>
  ),
  h3: ({ children }: any) => (
    <p className="font-semibold text-gray-900 mb-2 mt-3 first:mt-0">{children}</p>
  ),

  code: ({ children }: any) => (
    <code className="bg-gray-100 text-gray-900 px-1.5 py-0.5 rounded-md text-sm font-mono border border-gray-200">
      {children}
    </code>
  ),
  hr: () => <hr className="my-5 border-gray-200" />,
};

// ─────────────────────────────────────────────────────────────────────────
// Bold text renderer with clickable links (fallback for non‑markdown)
// ─────────────────────────────────────────────────────────────────────────

export function BoldText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={i} className="font-semibold text-stone-900">
              {part.slice(2, -2)}
            </strong>
          );
        }
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const subParts = part.split(urlRegex);
        return subParts.map((sub, j) => {
          if (urlRegex.test(sub)) {
            return (
              <a
                key={`${i}-${j}`}
                href={sub}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-800"
              >
                {sub}
              </a>
            );
          }
          return <React.Fragment key={`${i}-${j}`}>{sub}</React.Fragment>;
        });
      })}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Script‑aware text component
// ─────────────────────────────────────────────────────────────────────────

function ScriptAwareText({ text }: { text: string }) {
  const { fontFamily, dir } = getMessageTypography(text);
  return (
    <span dir={dir} style={{ fontFamily }}>
      {text}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// User message (original scanned content)
// ─────────────────────────────────────────────────────────────────────────

export function UserMessage({
  content,
  label,
  inputType,
  onEdit,
  onRetry,
}: {
  content: string;
  label: string;
  inputType: InputType;
  onEdit: () => void;
  onRetry: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const Icon = TYPE_ICON[inputType] ?? FileText;
  const MAX_LENGTH = 400;
  const isLong = content.length > MAX_LENGTH;
  const displayContent = expanded ? content : content.slice(0, MAX_LENGTH) + (isLong ? '…' : '');
  const typography = getMessageTypography(content);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex gap-2.5 sm:gap-3 items-start">
      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white border border-black/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-stone-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-stone-400 mb-1">{label}</div>
        <div
          dir={typography.dir}
          className="bg-white border border-black/[0.08] rounded-2xl rounded-tl-sm px-4 py-3 sm:px-4.5 sm:py-3.5 text-[14.5px] sm:text-[16px] text-stone-800 leading-relaxed whitespace-pre-wrap break-words shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
          style={{ fontFamily: typography.fontFamily }}
        >
          {displayContent}
          {isLong && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="ml-2 text-black/45 font-medium text-xs hover:text-black/65 focus:outline-none transition-colors"
              style={{ fontFamily: FONT_BODY }}
            >
              {expanded ? 'See less' : 'See more'}
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 mt-1.5 justify-end">
          <button
            onClick={handleCopy}
            title="Copy"
            className="p-1.5 rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
          >
            {copied ? <Check className="w-[15px] h-[15px] text-stone-900" strokeWidth={2.5} /> : <Copy className="w-[15px] h-[15px]" />}
          </button>
          <button
            onClick={onEdit}
            title="Edit"
            className="p-1.5 rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
          >
            <Pencil className="w-[15px] h-[15px]" />
          </button>
          <button
            onClick={onRetry}
            title="Retry"
            className="p-1.5 rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
          >
            <RotateCcw className="w-[15px] h-[15px]" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Scanning progress
// ─────────────────────────────────────────────────────────────────────────

export function ScanStepFlow({ inputType }: { inputType: InputType }) {
  const steps = useMemo(() => CHECKLIST_STEPS[inputType] ?? CHECKLIST_STEPS.text, [inputType]);
  const [phase, setPhase] = useState<'analyzing' | 'checklist' | 'generating'>('analyzing');
  const [doneCount, setDoneCount] = useState(0);

  useEffect(() => {
    setPhase('analyzing');
    setDoneCount(0);
    const timer1 = setTimeout(() => {
      setPhase('checklist');
      let i = 0;
      const interval = setInterval(() => {
        i += 1;
        setDoneCount(i);
        if (i >= steps.length) {
          clearInterval(interval);
          setPhase('generating');
        }
      }, 500);
      return () => clearInterval(interval);
    }, 1500);
    return () => clearTimeout(timer1);
  }, [steps.length, inputType]);

  if (phase === 'analyzing') {
    return (
      <div className="flex items-center px-1 py-2">
        <span
          className="scyra-shimmer-text text-[14.5px] font-semibold"
          style={{ fontFamily: FONT_BODY }}
        >
          Analyzing…
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-start px-1 py-2">
      <div className="flex-1 min-w-0 space-y-2">
        {steps.slice(0, doneCount).map((step) => (
          <div
            key={step}
            className="flex items-center gap-2.5 text-[13.5px] sm:text-[14px] font-medium text-stone-500 animate-[scyraFadeIn_0.3s_ease-out]"
            style={{ fontFamily: FONT_BODY }}
          >
            <span className="relative flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0">
              <span className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm" />
              <Check className="w-3 h-3 text-white relative z-10" strokeWidth={3} />
            </span>
            <span>{step}</span>
          </div>
        ))}
        {phase === 'generating' && (
          <div className="flex items-center gap-2.5 pt-0.5">
            <span className="w-5 h-5 flex-shrink-0" />
            <span
              className="scyra-shimmer-text text-[14.5px] font-semibold"
              style={{ fontFamily: FONT_BODY }}
            >
              Generating security report…
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// AnalysisSteps – staggered reveal with script‑aware text
// ─────────────────────────────────────────────────────────────────────────

type StepBlock =
  | { key: string; type: 'finding'; data: KeywordFinding }
  | { key: string; type: 'summary'; data: string }
  | { key: string; type: 'recommendation'; data: string[]; heading: string }
  | { key: string; type: 'report'; data: React.ReactNode };

export function AnalysisSteps({
  findings,
  explanation,
  recommendation,
  reportCard,
  seed,
}: {
  findings: KeywordFinding[];
  explanation: string;
  recommendation?: string;
  reportCard?: React.ReactNode;
  seed: string;
}) {
  const recHeading = useMemo(() => pickRecommendationHeading(seed), [seed]);

  const blocks: StepBlock[] = useMemo(() => {
    const b: StepBlock[] = findings.map((f, i) => ({ key: `finding-${i}`, type: 'finding', data: f }));
    b.push({ key: 'summary', type: 'summary', data: explanation });
    if (recommendation) {
      b.push({ key: 'recommendation', type: 'recommendation', data: formatRecommendation(recommendation), heading: recHeading });
    }
    if (reportCard) {
      b.push({ key: 'report', type: 'report', data: reportCard });
    }
    return b;
  }, [findings, explanation, recommendation, reportCard, recHeading]);

  return (
    <div className="relative pt-1" style={{ fontFamily: FONT_BODY }}>
      <div className="absolute left-[5px] top-1 bottom-1 w-px bg-stone-300" aria-hidden />
      <div className="space-y-4">
        {blocks.map((b, i) => {
          const style: React.CSSProperties = {
            animation: 'scyraFadeIn 0.5s ease-out forwards',
            animationDelay: `${i * 0.35}s`,
            opacity: 0,
          };

          if (b.type === 'finding') {
            return (
              <div key={b.key} className="relative flex gap-3" style={style}>
                <div className="relative z-10 w-3 h-3 rounded-full bg-stone-300 flex-shrink-0 mt-1.5" />
                <div className="flex-1 min-w-0 pt-0.5">
                  <h4 className="text-[16px] sm:text-[17px] font-semibold text-stone-800 mb-1">
                    <ScriptAwareText text={b.data.heading} />
                  </h4>
                  <p className="text-[15px] sm:text-[16px] text-stone-700 leading-7">
                    <BoldText text={b.data.content} />
                  </p>
                </div>
              </div>
            );
          }

          if (b.type === 'summary') {
            return (
              <div key={b.key} className="relative flex gap-3" style={style}>
                <div className="relative z-10 w-3 h-3 rounded-full bg-stone-500 flex-shrink-0 mt-1.5" />
                <div className="flex-1 min-w-0 pt-0.5">
                  <h4 className="text-[16px] sm:text-[17px] font-semibold text-stone-800 mb-1">Summary</h4>
                  <p className="text-[15px] sm:text-[16px] text-stone-700 leading-7">
                    <ScriptAwareText text={b.data} />
                  </p>
                </div>
              </div>
            );
          }

          if (b.type === 'recommendation') {
            return (
              <div key={b.key} className="relative flex gap-3" style={style}>
                <div className="relative z-10 w-3 h-3 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                <div className="flex-1 min-w-0 pt-0.5">
                  <h4 className="text-[16px] sm:text-[17px] font-semibold text-stone-800 mb-2">{b.heading}</h4>
                  {b.data.length === 1 ? (
                    <p className="text-[15px] sm:text-[16px] text-stone-700 leading-7">
                      <ScriptAwareText text={b.data[0]} />
                    </p>
                  ) : (
                    <ol className="space-y-2">
                      {b.data.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-[15px] sm:text-[16px] text-stone-700 leading-7">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10.5px] font-bold flex items-center justify-center mt-[3px]">
                            {idx + 1}
                          </span>
                          <span><ScriptAwareText text={point} /></span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </div>
            );
          }

          return (
            <div key={b.key} className="relative flex gap-3 pt-2" style={style}>
              <div className="relative z-10 w-3 h-3 rounded-full bg-[#C65B39] flex-shrink-0 mt-1.5" />
              <div className="flex-1 min-w-0">{b.data}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Response actions (copy / feedback / retry)
// ─────────────────────────────────────────────────────────────────────────

export function ResponseActions({
  getCopyText,
  onRetry,
  onFeedback,
}: {
  getCopyText: () => string;
  onRetry: () => void;
  onFeedback?: (type: 'up' | 'down') => void;
}) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(getCopyText());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  }, [getCopyText]);

  const handleFeedback = (type: 'up' | 'down') => {
    const newState = feedback === type ? null : type;
    setFeedback(newState);
    onFeedback?.(newState as 'up' | 'down');
  };

  return (
    <div className="flex items-center gap-0.5 pt-1 -ml-1.5 animate-[scyraFadeIn_0.2s_ease-out]">
      <button
        onClick={handleCopy}
        title="Copy"
        className="relative p-1.5 rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
      >
        {copied ? <Check className="w-[15px] h-[15px] text-stone-900" strokeWidth={2.5} /> : <Copy className="w-[15px] h-[15px]" />}
      </button>
      <button
        onClick={onRetry}
        title="Retry"
        className="p-1.5 rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
      >
        <RotateCcw className="w-[15px] h-[15px]" />
      </button>
      <button
        onClick={() => handleFeedback('up')}
        title="Good response"
        className={`p-1.5 rounded-md transition-colors ${
          feedback === 'up' ? 'text-[#C65B39] bg-stone-100' : 'text-stone-400 hover:bg-stone-100 hover:text-stone-700'
        }`}
      >
        <ThumbsUp className="w-[15px] h-[15px]" />
      </button>
      <button
        onClick={() => handleFeedback('down')}
        title="Bad response"
        className={`p-1.5 rounded-md transition-colors ${
          feedback === 'down' ? 'text-[#C65B39] bg-stone-100' : 'text-stone-400 hover:bg-stone-100 hover:text-stone-700'
        }`}
      >
        <ThumbsDown className="w-[15px] h-[15px]" />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Chat header dropdown
// ─────────────────────────────────────────────────────────────────────────

export function ChatHeaderMenu({
  onRename,
  onPin,
  onDelete,
  onOpenDocument,
  onOpenPresentation,
  pinned,
}: {
  onRename: () => void;
  onPin: () => void;
  onDelete: () => void;
  onOpenDocument: () => void;
  onOpenPresentation: () => void;
  pinned: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        title="More options"
        className={`p-1 rounded-md transition-colors flex items-center justify-center ${
          open ? 'bg-stone-200/70 text-stone-800' : 'text-stone-400 hover:bg-stone-200/60 hover:text-stone-700'
        }`}
      >
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 w-48 bg-white border border-black/10 rounded-lg shadow-lg py-1 z-20">
          <button
            onClick={() => { onOpenDocument(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <span className="w-3.5 text-center">📄</span> View Document
          </button>
          <button
            onClick={() => { onOpenPresentation(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <span className="w-3.5 text-center">📊</span> View Presentation
          </button>
          <div className="my-1 h-px bg-black/10" />
          <button
            onClick={() => { onPin(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <Pin className={`w-3.5 h-3.5 ${pinned ? 'text-blue-600 fill-blue-600' : 'text-stone-500'}`} />
            {pinned ? 'Unpin' : 'Pin'}
          </button>
          <button
            onClick={() => { onRename(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5 text-stone-500" /> Rename
          </button>
          <div className="my-1 h-px bg-black/10" />
          <button
            onClick={() => { onDelete(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] text-red-600 hover:bg-red-800 hover:text-white transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Mobile chat header menu
// ─────────────────────────────────────────────────────────────────────────

export function MobileChatHeaderMenu({
  onShare,
  onPin,
  onDelete,
  onOpenDocument,
  onOpenPresentation,
  pinned,
}: {
  onShare: () => void;
  onPin: () => void;
  onDelete: () => void;
  onOpenDocument: () => void;
  onOpenPresentation: () => void;
  pinned: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        title="More options"
        className={`p-1.5 rounded-lg transition-colors ${
          open ? 'bg-stone-200/70 text-stone-800' : 'text-stone-500 hover:bg-stone-100 hover:text-stone-700'
        }`}
      >
        <MoreVertical className="w-[18px] h-[18px]" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-black/10 rounded-lg shadow-lg py-1 z-30">
          <button
            onClick={() => { onShare(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5 text-stone-500" /> Share
          </button>
          <button
            onClick={() => { onPin(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <Pin className={`w-3.5 h-3.5 ${pinned ? 'text-blue-600 fill-blue-600' : 'text-stone-500'}`} />
            {pinned ? 'Unpin' : 'Pin'}
          </button>
          <div className="my-1 h-px bg-black/10" />
          <button
            onClick={() => { onOpenDocument(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <span className="w-3.5 text-center">📄</span> View Document
          </button>
          <button
            onClick={() => { onOpenPresentation(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <span className="w-3.5 text-center">📊</span> View Presentation
          </button>
          <div className="my-1 h-px bg-black/10" />
          <button
            onClick={() => { onDelete(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] text-red-600 hover:bg-red-800 hover:text-white transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// AI error message – premium ErrorCard, never raw error text
// ─────────────────────────────────────────────────────────────────────────

export function AiErrorMessage({
  code,
  message,
  onAction,
}: {
  /** Preferred: a classified ErrorCode from lib/errorTypes. */
  code?: ErrorCode;
  /** @deprecated legacy raw string prop — kept so older call sites don't break; always mapped through classifyError, never shown verbatim. */
  message?: string;
  onAction?: (action: ErrorAction['action']) => void;
}) {
  const resolvedCode: ErrorCode = code ?? classifyError({ rawMessage: message });
  return (
    <div className="flex items-start">
      <div className="flex-1 min-w-0">
        <ErrorCard code={resolvedCode} onAction={onAction} variant="compact" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Main AI result message – NOW with a `title` prop for specific fallback
// ─────────────────────────────────────────────────────────────────────────

export function AiResultMessage({
  result,
  onOpenReport,
  onOpenPresentation,
  onRetry,
  activePanelMode,
  title,
}: {
  result: ScamResultWithFindings;
  onOpenReport: () => void;
  onOpenPresentation: () => void;
  onRetry: () => void;
  activePanelMode: 'document' | 'presentation' | null;
  /** AI‑generated title (or content‑specific fallback) – used when attemptLabel is missing */
  title?: string;
}) {
  const isHighRisk = result.riskLevel === 'high' || result.riskLevel === 'medium';

  // Prefer the AI's attemptLabel – if absent, fall back to the AI‑generated title,
  // then to threatType, then to a minimal generic label.
  const attemptLabel = useMemo(() => {
    if (result.attemptLabel?.trim()) return result.attemptLabel;
    if (title?.trim()) return title;
    const raw = (result.threatType || '').trim();
    if (raw) {
      const alreadyHasAttempt = /attempt/i.test(raw);
      return alreadyHasAttempt ? `${raw} Detected` : `${raw} Attempt Detected`;
    }
    return 'Suspicious Activity Detected';
  }, [result.attemptLabel, result.threatType, title]);

  const getCopyText = useCallback(() => {
    const lines = [
      attemptLabel,
      `Risk: ${getRiskLevelLabel(result.riskLevel)} — ${result.riskScore}/100`,
      '',
      ...(result.findings ?? []).map((f) => `${f.heading}\n${f.content.replace(/\*\*/g, '')}`),
      '',
      `Summary\n${result.explanation}`,
      ...(result.recommendation ? ['', `Recommendation\n${result.recommendation}`] : []),
    ];
    return lines.join('\n\n');
  }, [result, attemptLabel]);

  const ReportCards = useMemo(
    () => (
      <div className="flex flex-col gap-3">
        <button
          onClick={onOpenReport}
          className={`text-left bg-white rounded-xl p-4 flex items-center gap-3 transition-all duration-200 group ${
            activePanelMode === 'document'
              ? 'border-2 border-blue-400 shadow-sm ring-2 ring-blue-100'
              : 'border border-black/10 hover:border-black/20 hover:shadow-sm'
          }`}
        >
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${activePanelMode === 'document' ? 'bg-blue-100' : 'bg-blue-50'}`}>
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-stone-800 flex items-center gap-1.5">
              Document Report
              {activePanelMode === 'document' && (
                <span className="text-[10px] font-bold uppercase tracking-wide text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">Active</span>
              )}
            </div>
            <div className="text-xs text-stone-500 mt-0.5">Full written breakdown & findings</div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-[#C65B39] flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
        </button>
        <button
          onClick={onOpenPresentation}
          className={`text-left bg-white rounded-xl p-4 flex items-center gap-3 transition-all duration-200 group ${
            activePanelMode === 'presentation'
              ? 'border-2 border-blue-400 shadow-sm ring-2 ring-blue-100'
              : 'border border-black/10 hover:border-black/20 hover:shadow-sm'
          }`}
        >
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${activePanelMode === 'presentation' ? 'bg-blue-100' : 'bg-blue-50'}`}>
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-stone-800 flex items-center gap-1.5">
              Presentation Report
              {activePanelMode === 'presentation' && (
                <span className="text-[10px] font-bold uppercase tracking-wide text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">Active</span>
              )}
            </div>
            <div className="text-xs text-stone-500 mt-0.5">Slide-style summary for sharing</div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-[#C65B39] flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    ),
    [onOpenReport, onOpenPresentation, activePanelMode]
  );

  return (
    <div className="flex items-start">
      <div className="flex-1 min-w-0 space-y-3">
        <h3
          className="text-[20px] sm:text-[24px] font-bold text-stone-800 leading-tight tracking-tight"
          style={{ fontFamily: FONT_BODY }}
        >
          {attemptLabel}
        </h3>

        <div className="flex items-center gap-3 flex-wrap">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold uppercase tracking-wide border ${getRiskColor(result.riskLevel, 'bg')} ${getRiskColor(result.riskLevel, 'text')} ${getRiskColor(result.riskLevel, 'border')}`}
          >
            {isHighRisk ? <ShieldAlert className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            {getRiskLevelLabel(result.riskLevel)}
          </span>
          <span className="text-[13.5px] text-stone-500" style={{ fontFamily: FONT_BODY }}>
            Risk score <span className="font-bold text-stone-800">{result.riskScore}/100</span>
          </span>
        </div>

        <AnalysisSteps
          findings={result.findings ?? []}
          explanation={result.explanation}
          recommendation={result.recommendation}
          reportCard={ReportCards}
          seed={result.scanId ?? result.explanation ?? (title ?? '')}
        />

        <ResponseActions getCopyText={getCopyText} onRetry={onRetry} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Follow-up user bubble
// ─────────────────────────────────────────────────────────────────────────

export function FollowUpUserBubble({
  content,
  onCopy,
  onEdit,
  onRetry,
}: {
  content: string;
  onCopy?: () => void;
  onEdit?: () => void;
  onRetry?: () => void;
}) {
  const { fontFamily, dir } = getMessageTypography(content);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    onCopy?.();
  };

  return (
    <div className="flex justify-end">
      <div className="max-w-[85%]">
        <div
          dir={dir}
          className="bg-[#ECEBE6] text-stone-800 rounded-2xl px-4 py-3 text-[14.5px] sm:text-[15px] leading-relaxed whitespace-pre-wrap break-words"
          style={{ fontFamily }}
        >
          {content}
        </div>
        <div className="flex items-center justify-end gap-1 mt-1">
          <button
            onClick={handleCopy}
            title="Copy"
            className="p-1.5 rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
          >
            {copied ? <Check className="w-[15px] h-[15px] text-stone-900" strokeWidth={2.5} /> : <Copy className="w-[15px] h-[15px]" />}
          </button>
          {onEdit && (
            <button
              onClick={onEdit}
              title="Edit"
              className="p-1.5 rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
            >
              <Pencil className="w-[15px] h-[15px]" />
            </button>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              title="Retry"
              className="p-1.5 rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
            >
              <RotateCcw className="w-[15px] h-[15px]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Follow-up AI bubble – suggestions now use a rotating icon set
// (dot / arrow / shield-question / play) instead of one repeated icon,
// while staying fully clickable buttons.
// ─────────────────────────────────────────────────────────────────────────

const SUGGESTION_ICONS = [Play, ArrowRight, ShieldQuestion, Circle] as const;

export function FollowUpAiBubble({
  content,
  suggestions,
  streaming = false,
  onSuggestionClick,
  onRetry,
  onFeedback,
}: {
  content: string;
  suggestions?: string[];
  streaming?: boolean;
  onSuggestionClick?: (text: string) => void;
  onRetry?: () => void;
  onFeedback?: (type: 'up' | 'down') => void;
}) {
  const { fontFamily, dir } = getMessageTypography(content);
  const getCopyText = useCallback(() => content, [content]);

  const hasVisibleText = content.trim().length > 0;

  // Each bubble picks its own random starting point in the icon set, so
  // suggestions in one answer don't always start with the same icon as
  // suggestions in the next answer (e.g. always arrow, always dot).
  const iconOffset = useMemo(() => Math.floor(Math.random() * SUGGESTION_ICONS.length), []);

  if (!hasVisibleText) {
    return streaming ? <FollowUpThinking /> : null;
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex">
        <div
          dir={dir}
          className="max-w-[90%] text-[15px] sm:text-[16px] text-stone-700 leading-relaxed break-words"
          style={{ fontFamily }}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {content}
          </ReactMarkdown>
        </div>
      </div>

      {/* Suggestion list: rotating icon per row (dot / arrow / shield / play), fully clickable */}
      {!streaming && suggestions && suggestions.length > 0 && (
        <div className="pt-1 space-y-2">
          <p
            className="text-[12.5px] font-semibold text-stone-700 mb-1.5 flex items-center gap-1.5"
            style={{ fontFamily: FONT_BODY }}
          >
            <Lightbulb className="w-4 h-4 text-amber-500" />
            Suggested Questions
          </p>

          {suggestions.map((s, idx) => {
            const Icon = SUGGESTION_ICONS[(idx + iconOffset) % SUGGESTION_ICONS.length];
            const isDot = Icon === Circle;
            const isPlay = Icon === Play;

            return (
              <button
                key={idx}
                onClick={() => onSuggestionClick?.(s)}
                className="flex items-center gap-2 w-full text-left group"
                style={{ fontFamily: FONT_BODY }}
              >
                <span
                  className={`flex-shrink-0 flex items-center justify-center ${
                    isDot ? 'w-5 h-5' : 'w-5 h-5 rounded-md bg-blue-600'
                  }`}
                >
                  {isDot ? (
                    <Circle className="w-2.5 h-2.5 text-blue-600 fill-blue-600" />
                  ) : (
                    <Icon
                      className="w-2.5 h-2.5 text-white"
                      strokeWidth={isPlay ? 0 : 2.5}
                      fill={isPlay ? 'white' : 'none'}
                    />
                  )}
                </span>
                <span className="text-[13.5px] text-stone-700 underline decoration-stone-300 underline-offset-2 group-hover:text-stone-900 group-hover:decoration-stone-500 transition-colors">
                  {s}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {!streaming && (
        <ResponseActions
          getCopyText={getCopyText}
          onRetry={onRetry || (() => {})}
          onFeedback={onFeedback}
        />
      )}
    </div>
  );
}

export function FollowUpThinking() {
  return (
    <div className="flex items-center gap-1.5 py-2.5 px-1">
      <span className="w-2 h-2 rounded-full bg-stone-400 animate-[scyraDotBounce_1.1s_infinite_0s]" />
      <span className="w-2 h-2 rounded-full bg-stone-400 animate-[scyraDotBounce_1.1s_infinite_0.15s]" />
      <span className="w-2 h-2 rounded-full bg-stone-400 animate-[scyraDotBounce_1.1s_infinite_0.3s]" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// New scan confirmation modal
// ─────────────────────────────────────────────────────────────────────────

export function NewScanConfirmModal({
  contentLabel,
  onConfirm,
  onCancel,
}: {
  contentLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px] px-4">
      <div
        className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 animate-[scyraFadeIn_0.2s_ease-out] border border-black/10"
        style={{ fontFamily: FONT_BODY }}
      >
        <p className="text-[14.5px] text-stone-700 leading-relaxed">
          This looks like a new <span className="font-semibold text-stone-900">{contentLabel}</span>. Start a new scan?
        </p>
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onCancel}
            className="px-3.5 py-1.5 rounded-lg text-[13px] font-semibold text-stone-600 hover:bg-stone-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-3.5 py-1.5 rounded-lg text-[13px] font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
          >
            Start New Scan
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Delete confirmation modal
// ─────────────────────────────────────────────────────────────────────────

export function DeleteConfirmModal({
  title = 'Delete this scan?',
  description = 'This scan and its full report — including any follow-up conversation — will be permanently deleted. This action cannot be undone.',
  onConfirm,
  onCancel,
}: {
  title?: string;
  description?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px] px-4">
      <div
        className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 animate-[scyraFadeIn_0.2s_ease-out] border border-black/10"
        style={{ fontFamily: FONT_BODY }}
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-4 h-4 text-red-600" />
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <h4 className="text-[15px] font-semibold text-stone-900 mb-1">{title}</h4>
            <p className="text-[13.5px] text-stone-600 leading-relaxed">{description}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onCancel}
            className="px-3.5 py-1.5 rounded-lg text-[13px] font-semibold text-stone-600 hover:bg-stone-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-3.5 py-1.5 rounded-lg text-[13px] font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}