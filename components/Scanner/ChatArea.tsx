'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  FileText,
  Globe,
  Lightbulb,
  Lock,
  MessageSquare,
  Pencil,
  Pin,
  Presentation,
  RotateCcw,
  Share2,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import { getRiskLevelLabel } from '@/lib/scannerHelpers';
import {
  FONT_BODY,
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

// Body text size (ChatGPT / Claude style reading size)
const BODY_TEXT = 'text-[16px] sm:text-[17px] leading-[1.65]';

// Long user content is collapsed after this many characters
const COLLAPSE_AT = 280;

// ─────────────────────────────────────────────────────────────────────────
// Shared markdown renderer config
// ─────────────────────────────────────────────────────────────────────────

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
            <span className="text-[14px] font-semibold text-gray-900 tracking-tight">{label}</span>
          </div>
        </div>
      );
    }
    return <p className="mb-3 last:mb-0 leading-[1.65] text-gray-800">{children}</p>;
  },

  ul: ({ children }: any) => (
    <ul className="list-disc pl-6 mb-4 space-y-1.5 marker:text-gray-500 text-gray-800">{children}</ul>
  ),
  ol: ({ children }: any) => (
    <ol className="list-decimal pl-6 mb-4 space-y-2 marker:text-gray-600 marker:font-semibold text-gray-800">
      {children}
    </ol>
  ),
  li: ({ children }: any) => (
    <li className="leading-[1.65] pl-1 [&>p]:m-0 [&>p]:block [&>ul]:mt-2 [&>ol]:mt-2">{children}</li>
  ),

  blockquote: ({ children }: any) => (
    <blockquote className="border-l-[3px] border-blue-200 bg-blue-50/40 rounded-r-lg pl-4 pr-3 py-2 my-4 text-gray-700 [&>p]:mb-1.5 [&>p:last-child]:mb-0 [&>p]:leading-relaxed">
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
    <h2 className="text-[21px] font-bold text-gray-900 mt-6 mb-2.5 first:mt-0 tracking-tight">{children}</h2>
  ),
  h2: ({ children }: any) => (
    <h3 className="text-[19px] font-semibold text-gray-900 mt-6 mb-2 first:mt-0 tracking-tight">{children}</h3>
  ),
  h3: ({ children }: any) => (
    <h4 className="text-[17px] font-semibold text-gray-900 mt-4 mb-1.5 first:mt-0">{children}</h4>
  ),

  table: ({ children }: any) => (
    <div className="my-4 overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full border-collapse text-[14.5px] text-left">{children}</table>
    </div>
  ),
  thead: ({ children }: any) => <thead className="bg-gray-50">{children}</thead>,
  tr: ({ children }: any) => <tr className="border-b border-gray-100 last:border-b-0">{children}</tr>,
  th: ({ children }: any) => (
    <th className="px-3.5 py-2.5 font-semibold text-gray-900 align-top whitespace-nowrap">{children}</th>
  ),
  td: ({ children }: any) => (
    <td className="px-3.5 py-2.5 text-gray-700 align-top leading-relaxed [&>p]:m-0">{children}</td>
  ),

  code: ({ children }: any) => (
    <code className="bg-gray-100 text-gray-900 px-1.5 py-0.5 rounded-md text-[13.5px] font-mono border border-gray-200 break-words">
      {children}
    </code>
  ),
  pre: ({ children }: any) => (
    <pre className="my-4 overflow-x-auto rounded-xl border border-gray-200 bg-gray-50 p-3.5 text-[13.5px] leading-relaxed font-mono text-gray-800 [&_code]:bg-transparent [&_code]:border-0 [&_code]:p-0 [&_code]:rounded-none [&_code]:break-normal whitespace-pre">
      {children}
    </pre>
  ),
  hr: () => <hr className="my-5 border-gray-200" />,
};

// ─────────────────────────────────────────────────────────────────────────
// Bold text renderer with clickable links (fallback for non-markdown)
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
        const subParts = part.split(/(https?:\/\/[^\s]+)/g);
        return subParts.map((sub, j) => {
          if (/^https?:\/\/[^\s]+$/.test(sub)) {
            return (
              <a
                key={`${i}-${j}`}
                href={sub}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-800 break-all"
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

function ScriptAwareText({ text }: { text: string }) {
  const { fontFamily, dir } = getMessageTypography(text);
  return (
    <span dir={dir} style={{ fontFamily }}>
      {text}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// USER MESSAGE — Gmail style (email) / SMS bubble / link card / text bubble
// ─────────────────────────────────────────────────────────────────────────

// Links inside text (used by the SMS bubble) are shown blue + underlined, like a real phone
const LINK_SPLIT_RE = /((?:https?:\/\/|www\.)[^\s<>"']+|\b[a-z0-9-]+(?:\.[a-z0-9-]+)+\/[^\s<>"']*)/gi;

function renderLinkified(text: string) {
  return text.split(LINK_SPLIT_RE).map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className="text-blue-600 underline underline-offset-2 break-all">
        {part}
      </span>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  );
}

function ExpandableText({
  text,
  max = COLLAPSE_AT,
  className = '',
  linkify = false,
}: {
  text: string;
  max?: number;
  className?: string;
  linkify?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const typography = getMessageTypography(text);
  const isLong = text.length > max;
  const shown = expanded || !isLong ? text : text.slice(0, max).trimEnd() + '…';
  return (
    <div dir={typography.dir} className={className} style={{ fontFamily: typography.fontFamily }}>
      {linkify ? renderLinkified(shown) : shown}
      {isLong && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="ml-1.5 text-stone-500 font-medium text-[13.5px] underline underline-offset-2 hover:text-stone-800 focus:outline-none"
          style={{ fontFamily: FONT_BODY }}
        >
          {expanded ? 'See less' : 'See more'}
        </button>
      )}
    </div>
  );
}

function GmailLogo({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-label="Gmail" role="img">
      <path fill="#4caf50" d="M45,16.2l-5,2.75l-5,4.75L35,40h7c1.657,0,3-1.343,3-3V16.2z" />
      <path fill="#1e88e5" d="M3,16.2l3.614,1.71L13,23.7V40H6c-1.657,0-3-1.343-3-3V16.2z" />
      <polygon fill="#e53935" points="35,11.2 24,19.45 13,11.2 12,17 13,23.7 24,31.95 35,23.7 36,17" />
      <path fill="#c62828" d="M3,12.298V16.2l10,7.5V11.2L9.876,8.859C9.132,8.301,8.228,8,7.298,8h0C4.924,8,3,9.924,3,12.298z" />
      <path fill="#fbc02d" d="M45,12.298V16.2l-10,7.5V11.2l3.124-2.341C38.868,8.301,39.772,8,40.702,8h0C43.076,8,45,9.924,45,12.298z" />
    </svg>
  );
}

const AVATAR_COLORS = ['bg-rose-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-600', 'bg-teal-600', 'bg-sky-600', 'bg-indigo-600', 'bg-fuchsia-600'];

function parseEmail(content: string) {
  const grab = (k: string) =>
    content.match(new RegExp(`^\\s*${k}\\s*:\\s*(.+)$`, 'im'))?.[1]?.trim() ?? '';
  const from = grab('from');
  const to = grab('to');
  const subject = grab('subject');
  const date = grab('date');
  const body = content
    .split('\n')
    .filter((l) => !/^\s*(from|to|cc|bcc|subject|date|reply-to)\s*:/i.test(l))
    .join('\n')
    .trim();

  const m = from.match(/^"?([^"<]+?)"?\s*<([^>]+)>/);
  const address = m ? m[2].trim() : from.match(/[^\s<>]+@[^\s<>]+/)?.[0] ?? '';
  const name = (m ? m[1].trim() : from.replace(/<.*>/, '').trim()) || address || 'Unknown sender';
  return { name, address, to: to || 'me', subject: subject || '(no subject)', date, body: body || content.trim() };
}

function GmailCard({ content }: { content: string }) {
  const e = useMemo(() => parseEmail(content), [content]);
  const initial = (e.name.match(/[\p{L}\p{N}]/u)?.[0] ?? '?').toUpperCase();
  const color = AVATAR_COLORS[(e.name.length + initial.charCodeAt(0)) % AVATAR_COLORS.length];

  return (
    <div className="w-full bg-white border border-stone-200 rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-stone-100 bg-stone-50/70">
        <GmailLogo />
        <span className="text-[13px] font-medium text-stone-600" style={{ fontFamily: FONT_BODY }}>
          Gmail
        </span>
      </div>

      <div className="px-4 sm:px-5 pt-4 pb-1 flex items-start gap-2">
        <h4 className="flex-1 min-w-0 text-[19px] sm:text-[21px] leading-snug text-stone-900 break-words" style={{ fontFamily: FONT_BODY }}>
          {e.subject}
        </h4>
        <span className="mt-1 flex-shrink-0 text-[11px] text-stone-600 bg-stone-100 rounded px-1.5 py-0.5">Inbox</span>
      </div>

      <div className="px-4 sm:px-5 py-3 flex items-start gap-3">
        <div className={`w-10 h-10 rounded-full ${color} text-white flex items-center justify-center text-[16px] font-medium flex-shrink-0`}>
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-[15px] font-semibold text-stone-900 break-all">{e.name}</span>
            {e.address && e.address !== e.name && (
              <span className="text-[13px] text-stone-500 break-all">&lt;{e.address}&gt;</span>
            )}
          </div>
          <div className="text-[13px] text-stone-500 flex items-center gap-1 break-all">
            to {e.to} <ChevronDown className="w-3 h-3 flex-shrink-0" />
          </div>
        </div>
        {e.date && <div className="hidden sm:block text-[12px] text-stone-500 flex-shrink-0">{e.date}</div>}
      </div>

      <div className="px-4 sm:px-5 pb-5 pt-1">
        <ExpandableText
          text={e.body}
          max={COLLAPSE_AT}
          className={`${BODY_TEXT} text-stone-800 whitespace-pre-wrap break-words`}
        />
      </div>
    </div>
  );
}

function extractLinks(content: string): string[] {
  const full = content.match(/\bhttps?:\/\/[^\s<>"']+/gi) ?? [];
  const bare = full.length
    ? []
    : content.match(/\b(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s<>"']*)?/gi) ?? [];
  return [...new Set([...full, ...bare].map((u) => u.replace(/[.,;:!?)]+$/, '')))];
}

function describeLink(raw: string) {
  const hasProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw);
  try {
    const u = new URL(hasProtocol ? raw : `https://${raw}`);
    return {
      host: u.hostname.replace(/^www\./, ''),
      path: (u.pathname === '/' ? '' : u.pathname) + u.search,
      secure: u.protocol === 'https:',
      hasProtocol,
      full: raw,
    };
  } catch {
    return null;
  }
}

function LinkCard({ content }: { content: string }) {
  const links = useMemo(() => extractLinks(content).map(describeLink).filter(Boolean) as NonNullable<ReturnType<typeof describeLink>>[], [content]);
  const primary = links[0];
  const leftover = useMemo(() => {
    let t = content;
    for (const l of links) t = t.replace(l.full, '');
    return t.replace(/\s+/g, ' ').trim();
  }, [content, links]);

  if (!primary) {
    return (
      <div className={`bg-white border border-stone-200 rounded-xl px-4 py-3 ${BODY_TEXT} text-stone-800 break-all font-mono text-[14px]`}>
        {content}
      </div>
    );
  }

  const isUnsafe = primary.hasProtocol && !primary.secure;

  return (
    <div className="w-full bg-white border border-stone-200 rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <div className="flex items-center gap-2 px-3 py-2 bg-stone-50 border-b border-stone-100">
        <span className="flex gap-1 mr-1">
          <span className="w-2.5 h-2.5 rounded-full bg-stone-300" />
          <span className="w-2.5 h-2.5 rounded-full bg-stone-300" />
          <span className="w-2.5 h-2.5 rounded-full bg-stone-300" />
        </span>
        <div className="flex-1 min-w-0 flex items-center gap-1.5 bg-white border border-stone-200 rounded-full px-3 py-1">
          {isUnsafe ? (
            <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
          ) : (
            <Lock className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
          )}
          <span className="text-[12.5px] text-stone-600 truncate font-mono">{primary.host}</span>
        </div>
      </div>

      <div className="px-4 sm:px-5 py-4 flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
          <Globe className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[18px] sm:text-[19px] font-semibold text-stone-900 break-all leading-snug">{primary.host}</div>
          <div className="mt-1 text-[13.5px] text-blue-700 font-mono break-all leading-relaxed">
            {primary.full.length > 120 ? primary.full.slice(0, 120) + '…' : primary.full}
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-2 py-0.5 border ${
                isUnsafe
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : primary.secure
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-stone-50 text-stone-600 border-stone-200'
              }`}
            >
              {isUnsafe ? 'Not secure (HTTP)' : primary.secure ? 'HTTPS' : 'No protocol given'}
            </span>
            {primary.path && primary.path.length > 1 && (
              <span className="text-[11px] text-stone-500 bg-stone-50 border border-stone-200 rounded-full px-2 py-0.5">
                Has path / parameters
              </span>
            )}
            <span className="text-[11px] text-stone-500 bg-stone-50 border border-stone-200 rounded-full px-2 py-0.5">
              Not opened — scanned safely
            </span>
          </div>
        </div>
      </div>

      {links.length > 1 && (
        <div className="px-4 sm:px-5 pb-3 -mt-1">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-stone-400 mb-1">
            Other links in this message
          </div>
          <ul className="space-y-0.5">
            {links.slice(1, 4).map((l, i) => (
              <li key={i} className="text-[13px] text-stone-600 font-mono break-all">{l.full}</li>
            ))}
          </ul>
          {links.length > 4 && (
            <div className="text-[12px] text-stone-400 mt-1">+{links.length - 4} more</div>
          )}
        </div>
      )}

      {leftover && (
        <div className="px-4 sm:px-5 pb-4 text-[14.5px] text-stone-600 border-t border-stone-100 pt-3 break-words">
          <ExpandableText text={leftover} max={COLLAPSE_AT} />
        </div>
      )}
    </div>
  );
}

function SmsBubble({ content }: { content: string }) {
  const sender = content.match(/(?:\+|00)?\d[\d\s().-]{8,16}\d/)?.[0]?.trim();
  return (
    <div className="max-w-[560px]">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center">
          <MessageSquare className="w-3.5 h-3.5 text-white" fill="currentColor" strokeWidth={0} />
        </div>
        <div className="leading-tight">
          <div className="text-[13px] font-semibold text-stone-800">Text Message</div>
          <div className="text-[11px] text-stone-400">{sender ? `Mentions ${sender}` : 'Unknown sender'}</div>
        </div>
      </div>
      <div className="relative inline-block max-w-full">
        <div className="bg-[#E9E9EB] text-stone-900 rounded-[22px] rounded-bl-md px-4 py-2.5">
          <ExpandableText
            text={content}
            max={COLLAPSE_AT}
            linkify
            className={`${BODY_TEXT} whitespace-pre-wrap break-words`}
          />
        </div>
      </div>
      <div className="text-[11px] text-stone-400 mt-1 ml-2">Received · SMS</div>
    </div>
  );
}

function TextBubble({ content }: { content: string }) {
  const typography = getMessageTypography(content);
  return (
    <div
      dir={typography.dir}
      className="bg-white border border-black/[0.08] rounded-2xl px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
      style={{ fontFamily: typography.fontFamily }}
    >
      <ExpandableText text={content} max={COLLAPSE_AT} className={`${BODY_TEXT} text-stone-800 whitespace-pre-wrap break-words`} />
    </div>
  );
}

export function UserMessage({
  content,
  inputType,
  onEdit,
  onRetry,
}: {
  content: string;
  /** @deprecated no longer rendered (the "Email scan / SMS scan" label was removed) */
  label?: string;
  inputType: InputType;
  onEdit: () => void;
  onRetry: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const btn = 'p-1.5 rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors';

  return (
    <div className="w-full">
      {inputType === 'email' ? (
        <GmailCard content={content} />
      ) : inputType === 'sms' ? (
        <SmsBubble content={content} />
      ) : inputType === 'url' ? (
        <LinkCard content={content} />
      ) : (
        <TextBubble content={content} />
      )}

      <div className="flex items-center gap-1 mt-1.5 justify-end">
        <button onClick={handleCopy} title="Copy" className={btn}>
          {copied ? <Check className="w-[15px] h-[15px] text-stone-900" strokeWidth={2.5} /> : <Copy className="w-[15px] h-[15px]" />}
        </button>
        <button onClick={onEdit} title="Edit" className={btn}>
          <Pencil className="w-[15px] h-[15px]" />
        </button>
        <button onClick={onRetry} title="Retry" className={btn}>
          <RotateCcw className="w-[15px] h-[15px]" />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Thinking block — 3 small spinning dots + bigger gray shimmer text
// ─────────────────────────────────────────────────────────────────────────

export function ThinkingBlock({ steps }: { steps: string[] }) {
  const [index, setIndex] = useState(0);
  const [loop, setLoop] = useState(0);

  const hasSteps = steps.length > 0;
  const base = hasSteps ? steps[Math.min(index, steps.length - 1)] : 'Analyzing';
  const label = base.endsWith('…') ? base : `${base}…`;
  const { fontFamily, dir } = getMessageTypography(label);

  const handleSweepEnd = () => {
    if (hasSteps && index < steps.length - 1) setIndex((i) => i + 1);
    else setLoop((l) => l + 1);
  };

  return (
    <div className="flex items-center gap-3 px-1 py-2.5 w-full">
      <style>{`@keyframes thinkShimmer{0%{background-position:150% 0}100%{background-position:-50% 0}}`}</style>

      {/* 3 small spinning dots */}
      <svg className="w-5 h-5 flex-shrink-0 animate-spin text-stone-500" viewBox="0 0 24 24" aria-hidden>
        <circle cx="12" cy="4" r="2.2" fill="currentColor" />
        <circle cx="19.5" cy="16.5" r="2.2" fill="currentColor" opacity="0.65" />
        <circle cx="4.5" cy="16.5" r="2.2" fill="currentColor" opacity="0.35" />
      </svg>

      <span
        key={`${label}-${loop}`}
        dir={dir}
        onAnimationEnd={handleSweepEnd}
        className="inline-block max-w-full break-words text-[17px] sm:text-[18px] font-medium"
        style={{
          fontFamily,
          backgroundImage:
            'linear-gradient(90deg,#78716c 0%,#78716c 40%,#d6d3d1 50%,#78716c 60%,#78716c 100%)',
          backgroundSize: '200% 100%',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          WebkitTextFillColor: 'transparent',
          animation: 'thinkShimmer 1.8s linear 1',
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// AnalysisSteps (kept for other components that may import it)
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
    if (reportCard) b.push({ key: 'report', type: 'report', data: reportCard });
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
                  <h4 className="text-[17px] sm:text-[18px] font-semibold text-stone-800 mb-1">
                    <ScriptAwareText text={b.data.heading} />
                  </h4>
                  <p className={`${BODY_TEXT} text-stone-700 break-words`}>
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
                  <h4 className="text-[17px] sm:text-[18px] font-semibold text-stone-800 mb-1">Summary</h4>
                  <p className={`${BODY_TEXT} text-stone-700 break-words`}>
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
                  <h4 className="text-[17px] sm:text-[18px] font-semibold text-stone-800 mb-2">{b.heading}</h4>
                  {b.data.length === 1 ? (
                    <p className={`${BODY_TEXT} text-stone-700 break-words`}>
                      <ScriptAwareText text={b.data[0]} />
                    </p>
                  ) : (
                    <ol className="list-decimal pl-6 space-y-2 marker:text-stone-600 marker:font-semibold">
                      {b.data.map((point, idx) => (
                        <li key={idx} className={`pl-1 ${BODY_TEXT} text-stone-700 break-words`}>
                          <ScriptAwareText text={point} />
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
              <div className="relative z-10 w-3 h-3 rounded-full bg-stone-700 flex-shrink-0 mt-1.5" />
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

  const base = 'p-1.5 rounded-md transition-colors';
  const idle = 'text-stone-400 hover:bg-stone-100 hover:text-stone-700';
  const on = 'text-stone-900 bg-stone-100';

  return (
    <div className="flex items-center gap-0.5 pt-1 -ml-1.5 animate-[scyraFadeIn_0.2s_ease-out]">
      <button onClick={handleCopy} title="Copy" className={`relative ${base} ${idle}`}>
        {copied ? <Check className="w-[15px] h-[15px] text-stone-900" strokeWidth={2.5} /> : <Copy className="w-[15px] h-[15px]" />}
      </button>
      <button onClick={onRetry} title="Retry" className={`${base} ${idle}`}>
        <RotateCcw className="w-[15px] h-[15px]" />
      </button>
      <button
        onClick={() => handleFeedback('up')}
        title="Good response"
        className={`${base} ${feedback === 'up' ? on : idle}`}
      >
        <ThumbsUp className="w-[15px] h-[15px]" />
      </button>
      <button
        onClick={() => handleFeedback('down')}
        title="Bad response"
        className={`${base} ${feedback === 'down' ? on : idle}`}
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
            <Pin className={`w-3.5 h-3.5 ${pinned ? 'text-stone-800 fill-stone-800' : 'text-stone-500'}`} />
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
            className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] text-red-600 hover:bg-red-50 transition-colors"
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
            className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5 text-stone-500" /> Share
          </button>
          <button
            onClick={() => { onPin(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <Pin className={`w-3.5 h-3.5 ${pinned ? 'text-stone-800 fill-stone-800' : 'text-stone-500'}`} />
            {pinned ? 'Unpin' : 'Pin'}
          </button>
          <div className="my-1 h-px bg-black/10" />
          <button
            onClick={() => { onOpenDocument(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <span className="w-3.5 text-center">📄</span> View Document
          </button>
          <button
            onClick={() => { onOpenPresentation(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <span className="w-3.5 text-center">📊</span> View Presentation
          </button>
          <div className="my-1 h-px bg-black/10" />
          <button
            onClick={() => { onDelete(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// AI error message
// ─────────────────────────────────────────────────────────────────────────

export function AiErrorMessage({
  code,
  message,
  onAction,
}: {
  code?: ErrorCode;
  /** @deprecated legacy raw string prop — always mapped through classifyError, never shown verbatim. */
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
// Collapsible (plain, ChatGPT-style disclosure)
// ─────────────────────────────────────────────────────────────────────────

function Collapsible({
  icon,
  title,
  count,
  defaultOpen = false,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const Icon = icon;
  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 py-1 text-left text-stone-600 hover:text-stone-900 transition-colors"
      >
        <Icon className="w-[17px] h-[17px] text-stone-500" />
        <span className="text-[15px] font-medium">{title}</span>
        {typeof count === 'number' && <span className="text-[13px] text-stone-400">({count})</span>}
        <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="pl-1 pb-1">{children}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SCAN RESULT — plain, professional text (ChatGPT-style). No cards/colours.
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
  /** kept for compatibility — the title now lives only in the page header */
  title?: string;
}) {
  const r = result as any;
  const findings: KeywordFinding[] = result.findings ?? [];
  const recommendations = useMemo(
    () => (result.recommendation ? formatRecommendation(result.recommendation) : []),
    [result.recommendation]
  );
  const seed = result.scanId ?? result.explanation ?? title ?? '';
  const recHeading = useMemo(() => pickRecommendationHeading(seed), [seed]);

  const indicators: any[] = Array.isArray(r.indicators) ? r.indicators : [];
  const tips: { headline: string; tip: string }[] = (Array.isArray(result.safetyTips) ? (result.safetyTips as any[]) : [])
    .map((t) => (typeof t === 'string' ? { headline: '', tip: t } : { headline: t?.headline ?? '', tip: t?.tip ?? '' }))
    .filter((t) => t.tip);

  const threatType = (result.threatType || '').trim();
  const targetBrand: string =
    typeof r.targetBrand === 'string' && !/^none/i.test(r.targetBrand) ? r.targetBrand : '';

  const getCopyText = useCallback(() => {
    const lines = [
      `${getRiskLevelLabel(result.riskLevel)} — ${result.riskScore}/100`,
      '',
      ...findings.map((f) => `${f.heading}\n${f.content.replace(/\*\*/g, '')}`),
      '',
      `Summary\n${result.explanation}`,
      ...(result.recommendation ? ['', `${recHeading}\n${result.recommendation}`] : []),
    ];
    return lines.join('\n\n');
  }, [result, findings, recHeading]);

  const h = 'text-[17px] sm:text-[18px] font-semibold text-stone-900 mt-6 mb-2';

  return (
    <div className="min-w-0 text-stone-800" style={{ fontFamily: FONT_BODY }}>
      {/* Verdict: one plain line */}
      <p className={`${BODY_TEXT} mb-1`}>
        <strong className="font-semibold text-stone-900">
          {getRiskLevelLabel(result.riskLevel)} ({result.riskScore}/100)
        </strong>
        {threatType && <> — {threatType}</>}
        {targetBrand && <> · Target: {targetBrand}</>}
      </p>

      {/* Summary */}
      <p className={`${BODY_TEXT} mt-3`}>
        <ScriptAwareText text={result.explanation} />
      </p>

      {/* Findings */}
      {findings.length > 0 && (
        <>
          <h4 className={h}>Key findings</h4>
          <ul className="list-disc pl-6 space-y-2.5 marker:text-stone-400">
            {findings.map((f, i) => (
              <li key={i} className={`${BODY_TEXT} pl-1`}>
                <strong className="font-semibold text-stone-900">
                  <ScriptAwareText text={f.heading} />.
                </strong>{' '}
                <BoldText text={f.content} />
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <>
          <h4 className={h}>{recHeading}</h4>
          <ol className="list-decimal pl-6 space-y-2 marker:text-stone-500">
            {recommendations.map((p, i) => (
              <li key={i} className={`${BODY_TEXT} pl-1`}>
                <ScriptAwareText text={p.replace(/^\s*[-*•]\s*/, '')} />
              </li>
            ))}
          </ol>
        </>
      )}

      {/* Indicators (collapsed) */}
      {indicators.length > 0 && (
        <Collapsible icon={AlertTriangle} title="Threat indicators" count={indicators.length}>
          <ul className="space-y-2 pt-2 list-disc pl-5 marker:text-stone-400">
            {indicators.map((ind, i) => (
              <li key={i} className="text-[15px] text-stone-700 leading-relaxed break-words">
                <span className="font-medium text-stone-900">{String(ind?.element ?? '')}</span>
                {ind?.assessment && <> ({String(ind.assessment).toLowerCase()})</>}: {String(ind?.value ?? '')}
              </li>
            ))}
          </ul>
        </Collapsible>
      )}

      {/* Tips (collapsed) */}
      {tips.length > 0 && (
        <Collapsible icon={Lightbulb} title="Safety tips" count={tips.length}>
          <ul className="space-y-2 pt-2 list-disc pl-5 marker:text-stone-400">
            {tips.map((t, i) => (
              <li key={i} className="text-[15px] text-stone-700 leading-relaxed">
                {t.headline && <span className="font-semibold text-stone-900">{t.headline}. </span>}
                {t.tip}
              </li>
            ))}
          </ul>
        </Collapsible>
      )}

      {/* Report cards: clean white */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {([
          { mode: 'document', onClick: onOpenReport, title: 'Document report', sub: 'Full written breakdown and findings', Icon: FileText },
          { mode: 'presentation', onClick: onOpenPresentation, title: 'Presentation report', sub: 'Slide-style summary for sharing', Icon: Presentation },
        ] as const).map((b) => {
          const active = activePanelMode === b.mode;
          return (
            <button
              key={b.mode}
              onClick={b.onClick}
              className={`group flex items-center gap-3.5 text-left bg-white rounded-xl px-4 py-3.5 border transition-all duration-150 ${
                active
                  ? 'border-stone-400 shadow-sm'
                  : 'border-stone-200 hover:border-stone-300 hover:shadow-sm'
              }`}
            >
              <span className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                <b.Icon className="w-5 h-5 text-stone-700" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[15px] font-semibold text-stone-900">{b.title}</span>
                <span className="block text-[13px] text-stone-500 mt-0.5">{b.sub}</span>
              </span>
              <ChevronRight className="w-4 h-4 text-stone-400 flex-shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:text-stone-600" />
            </button>
          );
        })}
      </div>

      <ResponseActions getCopyText={getCopyText} onRetry={onRetry} />
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
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      onCopy?.();
    } catch {
      /* ignore */
    }
  };

  const btn = 'p-1.5 rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors';

  return (
    <div className="flex justify-end">
      <div className="max-w-[85%]">
        <div className={`bg-[#F4F4F4] text-stone-800 rounded-2xl px-4 py-3 ${BODY_TEXT}`}>
          <ExpandableText text={content} max={COLLAPSE_AT} className="whitespace-pre-wrap break-words" />
        </div>
        <div className="flex items-center justify-end gap-1 mt-1">
          <button onClick={handleCopy} title="Copy" className={btn}>
            {copied ? <Check className="w-[15px] h-[15px] text-stone-900" strokeWidth={2.5} /> : <Copy className="w-[15px] h-[15px]" />}
          </button>
          {onEdit && (
            <button onClick={onEdit} title="Edit" className={btn}>
              <Pencil className="w-[15px] h-[15px]" />
            </button>
          )}
          {onRetry && (
            <button onClick={onRetry} title="Retry" className={btn}>
              <RotateCcw className="w-[15px] h-[15px]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Follow-up AI bubble
// ─────────────────────────────────────────────────────────────────────────

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

  if (!hasVisibleText) {
    return streaming ? <FollowUpThinking /> : null;
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex">
        <div
          dir={dir}
          className={`max-w-full sm:max-w-[92%] min-w-0 ${BODY_TEXT} text-stone-700 break-words`}
          style={{ fontFamily }}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {content}
          </ReactMarkdown>
        </div>
      </div>

      {!streaming && suggestions && suggestions.length > 0 && (
        <div className="flex flex-col items-start gap-2 pt-2">
          {suggestions.map((s, idx) => {
            const t = getMessageTypography(s);
            return (
              <button
                key={idx}
                type="button"
                dir={t.dir}
                onClick={() => onSuggestionClick?.(s)}
                className="max-w-full text-left text-[15px] leading-snug text-stone-700 bg-white border border-black/10 rounded-xl px-3.5 py-2 transition-colors duration-150 hover:bg-stone-50 hover:border-black/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
                style={{ fontFamily: t.fontFamily }}
              >
                {s}
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
        <p className="text-[15.5px] text-stone-700 leading-relaxed">
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
            <h4 className="text-[16px] font-semibold text-stone-900 mb-1">{title}</h4>
            <p className="text-[14px] text-stone-600 leading-relaxed">{description}</p>
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