export type ErrorCode =
  | 'offline'
  | 'ai_busy'
  | 'api_error'
  | 'timeout'
  | 'invalid_url'
  | 'scan_failed'
  | 'rate_limit'
  | 'session_expired'
  | 'unknown';

export type ErrorActionType = 'retry' | 'dismiss' | 'new_scan' | 'sign_in' | 'ok';

export interface ErrorAction {
  action: ErrorActionType;
  label: string;
}

export interface ErrorContent {
  title: string;
  message: string;
  primary: ErrorAction;
  secondary?: ErrorAction;
}

export const ERROR_CONTENT: Record<ErrorCode, ErrorContent> = {
  offline: {
    title: "You're offline",
    message: "We couldn't connect to the internet. Please check your connection and try again.",
    primary: { action: 'retry', label: 'Retry' },
    secondary: { action: 'dismiss', label: 'Dismiss' },
  },
  ai_busy: {
    title: 'Analysis is taking longer than expected',
    message: 'Our AI service is currently experiencing high demand. Please try again in a few moments.',
    primary: { action: 'retry', label: 'Retry Analysis' },
  },
  api_error: {
    title: 'Unable to complete the analysis',
    message: 'Something went wrong while processing your request. Please try again.',
    primary: { action: 'retry', label: 'Retry' },
  },
  timeout: {
    title: 'Request timed out',
    message: 'The analysis took longer than expected. This may be temporary.',
    primary: { action: 'retry', label: 'Retry' },
    secondary: { action: 'new_scan', label: 'Start New Scan' },
  },
  invalid_url: {
    title: 'Invalid input',
    message: 'Please check what you entered and try again.',
    primary: { action: 'ok', label: 'OK' },
  },
  scan_failed: {
    title: "Analysis couldn't be completed",
    message: "We couldn't finish analyzing this content due to an unexpected issue.",
    primary: { action: 'retry', label: 'Retry' },
  },
  rate_limit: {
    title: 'Too many requests',
    message: 'Please wait a moment before scanning again.',
    primary: { action: 'ok', label: 'OK' },
  },
  session_expired: {
    title: 'Your session has expired',
    message: 'Please sign in again to continue.',
    primary: { action: 'sign_in', label: 'Sign In' },
  },
  unknown: {
    title: 'Something unexpected happened',
    message: 'Please refresh the page or try again later.',
    primary: { action: 'retry', label: 'Retry' },
  },
};

// Maps a raw HTTP status (from our own API routes) to a sensible default code.
export function codeFromStatus(status: number): ErrorCode {
  if (status === 429) return 'rate_limit';
  if (status === 401 || status === 403) return 'session_expired';
  if (status >= 500) return 'ai_busy';
  return 'api_error';
}

// Safely extracts an ErrorCode from a parsed API error body (our routes
// always respond with { code: ErrorCode } on failure), falling back to 'unknown'.
export function extractErrorCode(body: unknown): ErrorCode {
  const code = (body as { code?: string } | null)?.code;
  return code && code in ERROR_CONTENT ? (code as ErrorCode) : 'unknown';
}

interface ClassifyInput {
  /** Legacy raw error string from older call sites — inspected only for
   *  keyword hints, never rendered to the user. */
  rawMessage?: string;
  /** HTTP status code, if available — takes priority over rawMessage. */
  status?: number;
}

// Turns whatever loose error info a call site has (a raw message, a
// status code, or nothing) into a safe, known ErrorCode. This is the
// single place that inspects raw/technical error text — the result
// (an ErrorCode) is the only thing that ever reaches the UI.
export function classifyError(input: ClassifyInput = {}): ErrorCode {
  const { rawMessage, status } = input;

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 'offline';
  }

  if (typeof status === 'number') {
    return codeFromStatus(status);
  }

  if (!rawMessage) return 'unknown';

  const msg = rawMessage.toLowerCase();

  if (msg.includes('failed to fetch') || msg.includes('network') || msg.includes('offline')) {
    return 'offline';
  }
  if (msg.includes('timeout') || msg.includes('timed out') || msg.includes('abort')) {
    return 'timeout';
  }
  if (msg.includes('429') || msg.includes('rate limit') || msg.includes('too many requests')) {
    return 'rate_limit';
  }
  if (msg.includes('401') || msg.includes('403') || msg.includes('unauthorized') || msg.includes('session')) {
    return 'session_expired';
  }
  if (msg.includes('invalid url') || msg.includes('malformed')) {
    return 'invalid_url';
  }
  if (msg.includes('json') || msg.includes('parse')) {
    return 'scan_failed';
  }
  if (msg.includes('500') || msg.includes('502') || msg.includes('503') || msg.includes('groq')) {
    return 'ai_busy';
  }

  return 'unknown';
}