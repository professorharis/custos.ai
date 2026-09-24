"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Mail,
  Link2,
  FileText,
  Sparkles,
  MessageSquare,
  Scan,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Zap,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// ─── Google Icon ──────────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

// ─── Left Panel ───────────────────────────────────────────────────────────────
function LeftPanel() {
  return (
    <div className="hidden lg:flex w-[460px] flex-shrink-0 bg-blue-600 flex-col justify-between p-12 relative overflow-hidden">
      {/* Background Decorative Patterns */}
      <div className="absolute top-10 right-10 grid grid-cols-3 gap-2 opacity-20">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 bg-white rounded-full" />
        ))}
      </div>
      <div className="absolute bottom-20 left-10 grid grid-cols-4 gap-2 opacity-20">
        {[...Array(16)].map((_, i) => (
          <div key={i} className="w-1 h-1 bg-white rounded-full" />
        ))}
      </div>
      <div className="absolute top-40 left-8 w-12 h-12 border border-white/20 rotate-45 rounded-lg" />
      <div className="absolute bottom-40 right-[-20px] w-24 h-24 bg-white/10 rounded-full blur-xl" />

      {/* Top: Brand */}
      <div className="relative z-10">
        <div className="flex items-center gap-2.5 text-white">
          <Shield className="w-6 h-6 fill-white/20" strokeWidth={2.5} />
          <span className="font-bold text-[18px] tracking-tight">AI Scam Shield</span>
        </div>
      </div>

      {/* Middle: Feature-Specific UI Objects (Static, No text-heavy cards) */}
      <div className="relative z-10 flex-1 flex items-center justify-center mt-10 mb-6">
        
        {/* Main Composition Container */}
        <div className="relative w-72 h-72 flex items-center justify-center">
          
          {/* Central AI Scanner Hub */}
          <div className="relative z-20 w-32 h-32 bg-white rounded-[2.5rem] shadow-2xl flex flex-col items-center justify-center border-[6px] border-blue-50/20">
            <Scan className="w-10 h-10 text-blue-600 mb-1" strokeWidth={2} />
            <Sparkles className="w-5 h-5 text-amber-400 absolute top-6 right-6" />
          </div>

          {/* Feature Object 1: Top Left - URL Scanning */}
          <div className="absolute top-4 left-0 bg-white rounded-2xl p-3 shadow-xl z-30 flex items-center gap-3 -rotate-3 border border-slate-100">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
              <Link2 className="w-5 h-5 text-slate-700" strokeWidth={2.5} />
            </div>
            <div className="pr-2">
              <div className="w-12 h-1.5 bg-red-500 rounded-full mb-1.5" />
              <div className="w-8 h-1.5 bg-slate-200 rounded-full" />
            </div>
          </div>

          {/* Feature Object 2: Top Right - SMS & Email */}
          <div className="absolute top-10 -right-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-[20px] p-4 z-10 rotate-6 shadow-lg flex items-center gap-2">
            <div className="bg-white p-2 rounded-lg shadow-sm">
              <Mail className="w-5 h-5 text-blue-600" strokeWidth={2.5} />
            </div>
            <div className="bg-white p-2 rounded-lg shadow-sm">
              <MessageSquare className="w-5 h-5 text-blue-600" strokeWidth={2.5} />
            </div>
          </div>

          {/* Feature Object 3: Bottom Left - AI Risk Score Gauge */}
          <div className="absolute bottom-6 -left-2 bg-white rounded-full w-20 h-20 shadow-2xl z-30 border-4 border-blue-50 flex items-center justify-center">
            {/* Fake SVG Gauge */}
            <div className="absolute inset-2 rounded-full border-[3px] border-slate-100" />
            <div className="absolute inset-2 rounded-full border-[3px] border-transparent border-t-red-500 border-r-red-500 rotate-45" />
            <div className="text-center">
              <span className="text-[20px] font-extrabold text-slate-800 leading-none block">94</span>
              <span className="text-[10px] font-bold text-slate-400 block">%</span>
            </div>
          </div>

          {/* Feature Object 4: Bottom Right - AI Summary / Report */}
          <div className="absolute bottom-12 -right-6 bg-white rounded-2xl p-3 shadow-xl z-10 rotate-[-8deg] border border-slate-100">
            <div className="flex gap-2 items-start mb-2">
              <FileText className="w-5 h-5 text-slate-800" strokeWidth={2} />
              <div className="w-2 h-2 bg-amber-400 rounded-full" />
            </div>
            <div className="space-y-1.5">
              <div className="w-16 h-1.5 bg-slate-200 rounded-full" />
              <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
              <div className="w-10 h-1.5 bg-slate-200 rounded-full" />
            </div>
          </div>

        </div>
      </div>

      {/* Bottom: Tool-Specific Typography & Dots */}
      <div className="relative z-10 text-center">
        <h2 className="text-white text-[26px] font-bold tracking-tight mb-3">
          Analyze & Protect
        </h2>
        <p className="text-blue-100/90 text-[14px] leading-relaxed mb-8 px-2 font-medium">
          Instantly scan any SMS, email, or URL. Get real-time risk scores, detailed AI summaries, and actionable safety tips to stay secure.
        </p>
        
        {/* Pagination Dots */}
        <div className="flex items-center justify-center gap-2">
          <div className="w-6 h-1.5 bg-white rounded-full" />
          <div className="w-1.5 h-1.5 bg-white/40 rounded-full transition-colors hover:bg-white/60 cursor-pointer" />
          <div className="w-1.5 h-1.5 bg-white/40 rounded-full transition-colors hover:bg-white/60 cursor-pointer" />
        </div>
      </div>
    </div>
  );
}


// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember]         = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [error, setError]               = useState("");

  // Pre-fill email if redirected from signup "already exists" screen
  useEffect(() => {
    const preEmail = searchParams.get("email");
    if (preEmail) setEmail(decodeURIComponent(preEmail));
  }, [searchParams]);

  // Redirect if already logged in → now goes to home instead of dashboard
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace("/"); // <-- CHANGED
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        if (
          error.message.toLowerCase().includes("invalid login") ||
          error.message.toLowerCase().includes("invalid credentials") ||
          error.message.toLowerCase().includes("email not confirmed")
        ) {
          throw new Error("Incorrect email or password. Please try again.");
        }
        throw new Error(error.message);
      }

      router.push("/"); // <-- CHANGED (was "/dashboard")
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` }, // <-- CHANGED
    });
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex">
      <LeftPanel />

      <div className="flex-1 flex items-center justify-center px-6 py-12 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="max-w-[400px] w-full"
        >
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-800 text-[16px]">AI Scam Shield</span>
          </div>

          <div className="mb-7">
            <h1 className="text-[28px] font-bold text-slate-800 tracking-tight leading-tight">Welcome back</h1>
            <p className="text-slate-500 text-[15px] mt-1.5">Sign in to continue to your account.</p>
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

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 font-semibold py-3 rounded-xl hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-all shadow-sm text-[15px]"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-5">
            <div className="flex-1 border-t border-slate-200" />
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">or</span>
            <div className="flex-1 border-t border-slate-200" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-[13px] font-semibold text-slate-600 uppercase tracking-wide">Email</label>
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

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[13px] font-semibold text-slate-600 uppercase tracking-wide">Password</label>
                <Link href="/forgot-password" className="text-[12.5px] font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" strokeWidth={1.5} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all text-[15px] text-slate-800 placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-[18px] h-[18px]" strokeWidth={1.5} /> : <Eye className="w-[18px] h-[18px]" strokeWidth={1.5} />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setRemember(!remember)}
                className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  remember ? "bg-blue-600 border-blue-600" : "border-slate-300 bg-white"
                }`}
              >
                {remember && (
                  <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l2.5 2.5L9 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <span
                onClick={() => setRemember(!remember)}
                className="text-[13.5px] text-slate-600 cursor-pointer select-none hover:text-slate-800 transition-colors"
              >
                Remember me for 30 days
              </span>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#0A0F1E] hover:bg-slate-800 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-slate-900/20 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex justify-center items-center text-[15px]"
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  "Sign in"
                )}
              </button>
            </div>
          </form>

          <p className="text-center text-[14px] text-slate-500 mt-6">
            Don't have an account?{" "}
            <Link href="/signup" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
              Create one free
            </Link>
          </p>
        </motion.div>
      </div>
    </main>
  );
}