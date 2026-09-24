"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link"; // Next.js ka link
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Scan,
  Sparkles,
  MessageSquare,
  FileText,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Zap,
  ArrowRight,
  Link2, 
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────
type Screen = "form" | "success" | "already-exists";

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

// ─── Password strength ────────────────────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const strength =
    password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^a-zA-Z0-9]/.test(password) ? 4
    : password.length >= 10 && /[A-Z]/.test(password) && /[0-9]/.test(password) ? 3
    : password.length >= 8 ? 2
    : 1;
  const colors = ["", "bg-red-500", "bg-amber-400", "bg-blue-500", "bg-emerald-500"];
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="flex gap-1 flex-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength ? colors[strength] : "bg-slate-200"}`}
          />
        ))}
      </div>
      <span className={`text-[11px] font-semibold ${
        strength === 4 ? "text-emerald-600" : strength === 3 ? "text-blue-600" : strength === 2 ? "text-amber-600" : "text-red-500"
      }`}>{labels[strength]}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SignupPage() {
  const router = useRouter();

  const [screen, setScreen]             = useState<Screen>("form");
  const [name, setName]                 = useState("");
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [error, setError]               = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");

  // Redirect if already logged in → now goes to home instead of dashboard
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace("/"); // <-- CHANGED
    });
  }, [router]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleGoogleSignup = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` }, // <-- CHANGED
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });

      if (signupError) {
        if (
          signupError.message.toLowerCase().includes("already registered") ||
          signupError.message.toLowerCase().includes("already exists") ||
          signupError.message.toLowerCase().includes("email address is already")
        ) {
          setRegisteredEmail(email);
          setScreen("already-exists");
          return;
        }
        throw new Error(signupError.message);
      }

      if (data?.user && data.user.identities && data.user.identities.length === 0) {
        setRegisteredEmail(email);
        setScreen("already-exists");
        return;
      }

      setScreen("success");
      setTimeout(() => router.push("/"), 2800); // already home
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Success screen ─────────────────────────────────────────────────────────
  if (screen === "success") {
    return (
      <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.93 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="max-w-sm w-full bg-white rounded-2xl border border-slate-100 shadow-xl p-10 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 220, damping: 14 }}
            className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </motion.div>
          <h2 className="text-[24px] font-bold text-slate-800 mb-2">You're in!</h2>
          <p className="text-slate-500 text-[15px] leading-relaxed mb-1">
            Welcome, <span className="font-semibold text-slate-700">{name || email}</span>.
          </p>
          <p className="text-slate-400 text-sm mb-8">Taking you to the home page…</p>
          <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-emerald-500 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2.8, ease: "linear" }}
            />
          </div>
        </motion.div>
      </main>
    );
  }

  // ── Already-exists screen ──────────────────────────────────────────────────
  if (screen === "already-exists") {
    return (
      <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="max-w-sm w-full bg-white rounded-2xl border border-slate-100 shadow-xl p-10 text-center"
        >
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-[22px] font-bold text-slate-800 mb-2">Account already exists</h2>
          <p className="text-slate-500 text-[14.5px] leading-relaxed mb-1">
            An account with
          </p>
          <p className="font-semibold text-slate-800 text-[15px] mb-4 break-all">{registeredEmail}</p>
          <p className="text-slate-400 text-sm mb-8">is already registered. Sign in instead.</p>

          <div className="space-y-3">
            <Link
              href={`/login?email=${encodeURIComponent(registeredEmail)}`}
              className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all shadow-md shadow-blue-200 active:scale-[0.98]"
            >
              Sign in to your account <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => { setScreen("form"); setError(""); setPassword(""); }}
              className="w-full border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium py-3 rounded-xl transition-all text-[14.5px]"
            >
              Try a different email
            </button>
            <Link href="/forgot-password" className="block text-[13.5px] text-blue-600 hover:text-blue-700 font-medium transition-colors">
              Forgot your password?
            </Link>
          </div>
        </motion.div>
      </main>
    );
  }

  // ── Main form ──────────────────────────────────────────────────────────────
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
            <h1 className="text-[28px] font-bold text-slate-800 tracking-tight leading-tight">Create your account</h1>
            <p className="text-slate-500 text-[15px] mt-1.5">Free forever. No credit card required.</p>
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
            onClick={handleGoogleSignup}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 font-semibold py-3 rounded-xl hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-all shadow-sm text-[15px]"
          >
            <GoogleIcon />
            Sign up with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-5">
            <div className="flex-1 border-t border-slate-200" />
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">or</span>
            <div className="flex-1 border-t border-slate-200" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="block text-[13px] font-semibold text-slate-600 uppercase tracking-wide">Full name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" strokeWidth={1.5} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Alex Rivera"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all text-[15px] text-slate-800 placeholder:text-slate-400"
                />
              </div>
            </div>

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
              <label className="block text-[13px] font-semibold text-slate-600 uppercase tracking-wide">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" strokeWidth={1.5} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
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
              <PasswordStrength password={password} />
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
                  "Create account"
                )}
              </button>
            </div>
          </form>

          <p className="text-center text-[14px] text-slate-500 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </main>
  );
}