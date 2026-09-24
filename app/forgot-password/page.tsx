"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Mail,
  Lock,
  Zap,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// ─── Google Icon ──────────────────────────────────────────────────────────────
function LeftPanel() {
  return (
    <div className="hidden lg:flex w-[420px] flex-shrink-0 bg-[#0A0F1E] flex-col justify-between p-12 relative overflow-hidden">
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-blue-600/20 rounded-full blur-[90px]" />
      <div className="absolute bottom-0 right-0 w-56 h-56 bg-indigo-500/10 rounded-full blur-[80px]" />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-14">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-700/40">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-[17px] tracking-tight">AI Scam Shield</span>
        </div>

        <div className="space-y-4">
          {[
            { icon: Shield, label: "Real-time scam detection" },
            { icon: Zap,    label: "AI analysis in milliseconds" },
            { icon: Lock,   label: "End-to-end encrypted scans" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-slate-300 text-[14px]">{label}</span>
            </div>
          ))}
        </div>

        {/* Reset info card */}
        <div className="mt-10 bg-white/5 border border-white/8 rounded-xl p-5">
          <p className="text-slate-300 text-[13px] font-semibold mb-2">How password reset works</p>
          <div className="space-y-2.5">
            {[
              "Enter your registered email address",
              "We send you a secure reset link",
              "Click the link to set a new password",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-300 text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-slate-400 text-[13px] leading-snug">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-10">
        <div className="w-6 h-0.5 bg-blue-500 mb-3" />
        <p className="text-slate-300 text-[14px] leading-relaxed">
          "Your security is our priority. Reset links expire in 60 minutes."
        </p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ForgotPasswordPage() {
  const [email, setEmail]         = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState("");
  const [sent, setSent]           = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw new Error(error.message);

      setSent(true);
      // Start 60s cooldown for resend
      startCooldown();
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const startCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((c) => {
        if (c <= 1) { clearInterval(interval); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    try {
      await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      startCooldown();
    } catch {
      // silent — resend attempt
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex">
      <LeftPanel />

      <div className="flex-1 flex items-center justify-center px-6 py-12 overflow-y-auto">
        <AnimatePresence mode="wait">
          {sent ? (
            /* ── Success State ───────────────────────────────────────────── */
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="max-w-[400px] w-full text-center"
            >
              {/* Mobile brand */}
              <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-slate-800 text-[16px]">AI Scam Shield</span>
              </div>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 220, damping: 14 }}
                className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle2 className="w-10 h-10 text-blue-600" />
              </motion.div>

              <h2 className="text-[26px] font-bold text-slate-800 mb-2">Check your inbox</h2>
              <p className="text-slate-500 text-[15px] leading-relaxed mb-1">Reset link sent to</p>
              <p className="font-semibold text-slate-800 text-[15px] mb-6 break-all">{email}</p>

              {/* Info tips */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-8 text-left space-y-2">
                <p className="text-[12.5px] font-semibold text-slate-600 uppercase tracking-wide">Tips</p>
                <p className="text-[13px] text-slate-500">• Check your spam or junk folder</p>
                <p className="text-[13px] text-slate-500">• The link expires in 60 minutes</p>
                <p className="text-[13px] text-slate-500">• Only the most recent link will work</p>
              </div>

              {/* Resend */}
              <button
                onClick={handleResend}
                disabled={resendCooldown > 0 || isLoading}
                className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl border font-semibold text-[14.5px] transition-all mb-4 ${
                  resendCooldown > 0
                    ? "border-slate-200 text-slate-400 cursor-not-allowed bg-slate-50"
                    : "border-blue-200 text-blue-600 hover:bg-blue-50 active:scale-[0.98]"
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend reset link"}
              </button>

              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-[14px] text-slate-500 hover:text-slate-700 font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </Link>
            </motion.div>
          ) : (
            /* ── Form ───────────────────────────────────────────────────── */
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="max-w-[400px] w-full"
            >
              {/* Mobile brand */}
              <div className="lg:hidden flex items-center gap-2 mb-8">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-slate-800 text-[16px]">AI Scam Shield</span>
              </div>

              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-slate-700 font-medium transition-colors mb-8"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to sign in
              </Link>

              <div className="mb-7">
                <h1 className="text-[28px] font-bold text-slate-800 tracking-tight leading-tight">Reset password</h1>
                <p className="text-slate-500 text-[15px] mt-1.5 leading-relaxed">
                  Enter your email and we'll send a secure reset link.
                </p>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-red-50 border border-red-100 rounded-xl p-3.5 mb-5 flex items-start gap-2.5"
                  >
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <span className="text-[13.5px] text-red-700 leading-snug">{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-semibold text-slate-600 uppercase tracking-wide">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" strokeWidth={1.5} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all text-[15px] text-slate-800 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex justify-center items-center text-[15px]"
                  >
                    {isLoading ? (
                      <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      "Send reset link"
                    )}
                  </button>
                </div>
              </form>

              <p className="text-center text-[14px] text-slate-500 mt-6">
                Remembered it?{" "}
                <Link href="/login" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
                  Sign in instead
                </Link>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}