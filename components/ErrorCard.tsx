'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import { ERROR_CONTENT, type ErrorCode, type ErrorActionType } from '@/lib/errorTypes';

interface ErrorCardProps {
  code: ErrorCode;
  /** 'compact' is used inline inside chat bubbles (AiErrorMessage) — smaller padding, no icon circle. */
  variant?: 'default' | 'compact';
  /** Preferred callback — receives the semantic action ('retry' | 'dismiss' | 'new_scan' | 'sign_in' | 'ok'). */
  onAction?: (action: ErrorActionType) => void;
  /** Convenience overrides — if provided, these run instead of falling through to onAction for that specific action. */
  onRetry?: () => void;
  onDismiss?: () => void;
  onSecondary?: () => void;
}

// Inline error card — replaces raw error strings with a calm, branded
// card. Never receives or renders technical details (stack traces,
// status codes, provider error text) — only a pre-classified ErrorCode.
export const ErrorCard: React.FC<ErrorCardProps> = ({
  code,
  variant = 'default',
  onAction,
  onRetry,
  onDismiss,
  onSecondary,
}) => {
  const content = ERROR_CONTENT[code];
  const compact = variant === 'compact';

  const runAction = (action: ErrorActionType, isPrimary: boolean) => {
    if (action === 'retry' && onRetry) return onRetry();
    if (action === 'dismiss' && onDismiss) return onDismiss();
    if (!isPrimary && onSecondary) return onSecondary();
    onAction?.(action);
  };

  return (
    <div
      className={`flex items-start gap-3 bg-white border border-red-200/70 rounded-2xl shadow-sm ${
        compact ? 'px-3.5 py-3 max-w-md' : 'px-4 sm:px-5 py-4 max-w-xl'
      }`}
    >
      <div
        className={`rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 ${
          compact ? 'w-6 h-6 mt-0.5' : 'w-8 h-8 mt-0.5'
        }`}
      >
        <AlertTriangle className={compact ? 'w-3 h-3 text-red-500' : 'w-4 h-4 text-red-500'} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`font-semibold text-stone-800 ${compact ? 'text-[13px]' : 'text-[14px]'}`}>{content.title}</p>
        <p className={`text-stone-500 mt-1 leading-relaxed ${compact ? 'text-[12px]' : 'text-[13px]'}`}>
          {content.message}
        </p>
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() => runAction(content.primary.action, true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-900 text-white text-[12px] font-medium hover:bg-stone-800 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            {content.primary.label}
          </button>
          {content.secondary && (
            <button
              onClick={() => runAction(content.secondary!.action, false)}
              className="px-3 py-1.5 rounded-full border border-black/10 text-stone-600 text-[12px] font-medium hover:bg-stone-50 transition-colors"
            >
              {content.secondary.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// Top banner — Claude-style: a floating amber pill, not a full-width red
// bar. Centered over the content, rounded, with a warning triangle and a
// dismiss X. Used for transient/global issues (can't reach the API,
// offline, etc.) where a full inline card isn't tied to one message.
// ─────────────────────────────────────────────────────────────────────────
interface ErrorBannerProps {
  code: ErrorCode;
  onDismiss: () => void;
  onRetry?: () => void;
  /** Overrides the default ERROR_CONTENT message — e.g. "We couldn't connect to Claude. Please check your network connection and try again." */
  message?: string;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ code, onDismiss, onRetry, message }) => {
  const content = ERROR_CONTENT[code];
  const text = message ?? content.message;

  return (
    <div className="w-full flex justify-center px-4 pt-3 pointer-events-none">
      <div
        role="alert"
        className="pointer-events-auto flex items-center gap-2.5 bg-amber-50 border border-amber-300/70 text-amber-900 rounded-xl shadow-sm px-4 py-2.5 max-w-xl w-full sm:w-auto"
      >
        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" strokeWidth={2.25} />
        <span className="text-[13px] leading-snug flex-1">{text}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-[12.5px] font-semibold underline underline-offset-2 hover:opacity-75 transition-opacity flex-shrink-0"
          >
            {content.primary.label}
          </button>
        )}
        <button
          onClick={onDismiss}
          title="Dismiss"
          className="flex-shrink-0 text-amber-600/70 hover:text-amber-900 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};