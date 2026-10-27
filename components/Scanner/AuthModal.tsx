'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Eye, EyeOff, Mail, ShieldCheck, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { FONT_BODY, FONT_HEADING } from './types';

export type AuthMode = 'login' | 'signup';

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

/**
 * One window for both Login and Sign up. Opens on top of the chat screen
 * (sidebar stays visible behind the dimmed backdrop).
 */
export function AuthModal({
  open,
  mode,
  onModeChange,
  onClose,
}: {
  open: boolean;
  mode: AuthMode;
  onModeChange: (m: AuthMode) => void;
  onClose: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const emailRef = useRef<HTMLInputElement>(null);

  const isSignup = mode === 'signup';

  // Reset the form every time the window opens.
  useEffect(() => {
    if (open) {
      setEmail('');
      setPassword('');
      setShowPassword(false);
      setError('');
      setInfo('');
      setLoading(false);
      setGoogleLoading(false);
    }
  }, [open]);

  // Clear messages when switching between Login / Sign up.
  useEffect(() => {
    setError('');
    setInfo('');
  }, [mode]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const handleGoogle = async () => {
    setError('');
    setInfo('');
    setGoogleLoading(true);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    });
    // On success the browser redirects to Google, so only errors come back here.
    if (oauthError) {
      setError(oauthError.message);
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setError('Enter a valid email to continue.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (isSignup) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (signUpError) {
          setError(signUpError.message);
        } else if (data.session) {
          // Email confirmation is off → already signed in.
          onClose();
        } else {
          setInfo('Account created! Check your email to confirm, then log in.');
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          setError(signInError.message);
        } else {
          // MainArea's onAuthStateChange picks up the new session.
          onClose();
        }
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full bg-white border border-stone-300 rounded-xl py-3 text-[16px] sm:text-[14.5px] text-stone-900 placeholder:text-stone-400 outline-none focus:border-stone-500 focus:ring-2 focus:ring-stone-900/5 transition-all';

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-6 overflow-y-auto">
      <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-[2px]" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={isSignup ? 'Sign up' : 'Log in'}
        className="relative z-10 w-full max-w-[400px] bg-white rounded-3xl border border-black/5 shadow-[0_12px_60px_rgba(0,0,0,0.22)] p-6 sm:p-8 animate-[scyraFadeIn_0.18s_ease-out]"
        style={{ fontFamily: FONT_BODY }}
      >
        <button
          onClick={onClose}
          title="Close"
          className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          <span className="w-11 h-11 rounded-full bg-[#C65B39] text-white flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </span>
          <h2
            className="mt-4 text-[22px] font-semibold tracking-tight text-stone-900"
            style={{ fontFamily: FONT_HEADING }}
          >
            {isSignup ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="mt-1 text-[13.5px] text-stone-500">
            {isSignup
              ? 'Save your scans and chats. No credit card required.'
              : 'Log in to see your saved scans and chats.'}
          </p>
        </div>

        {error && (
          <div className="mt-5 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 text-[12.5px] text-red-700">
            {error}
          </div>
        )}
        {info && (
          <div className="mt-5 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5 text-[12.5px] text-emerald-800">
            {info}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogle}
          disabled={googleLoading || loading}
          className="mt-6 w-full flex items-center justify-center gap-3 bg-white border border-stone-300 text-stone-900 font-medium py-3 rounded-xl hover:bg-stone-50 active:scale-[0.99] disabled:opacity-60 transition-all text-[14.5px]"
        >
          <GoogleIcon />
          {googleLoading ? 'Redirecting…' : 'Continue with Google'}
        </button>

        <div className="flex items-center gap-4 my-5">
          <div className="flex-1 border-t border-stone-200" />
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest">or</span>
          <div className="flex-1 border-t border-stone-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" strokeWidth={1.6} />
            <input
              ref={emailRef}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={`${inputCls} pl-10 pr-4`}
            />
          </div>

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSignup ? 'Create a password' : 'Password'}
              className={`${inputCls} pl-4 pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              title={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-700 disabled:opacity-60 text-white font-medium py-3 rounded-xl transition-all active:scale-[0.99] text-[14.5px]"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <>
                <span>{isSignup ? 'Sign up with email' : 'Log in with email'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-5 text-center text-[13px] text-stone-500">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => onModeChange(isSignup ? 'login' : 'signup')}
            className="font-medium text-stone-900 underline underline-offset-2 hover:text-[#C65B39] transition-colors"
          >
            {isSignup ? 'Log in' : 'Sign up'}
          </button>
        </p>

        <p className="mt-4 text-center text-[11.5px] leading-snug text-stone-400">
          By continuing, you agree to our{' '}
          <a href="/terms" className="underline hover:text-stone-600">Terms</a> and{' '}
          <a href="/privacy" className="underline hover:text-stone-600">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}

export default AuthModal;