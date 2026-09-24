"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ShieldAlert, ShieldCheck, Link2 } from "lucide-react";

// ─── Scripted demo steps ───────────────────────────────────────────────
// Swap these for real captured examples whenever you have them —
// the modal just needs { label, text, verdict, score } shapes.
const DEMO_STEPS = [
  {
    label: "SMS",
    text: "Bank alert: unusual sign-in detected. Confirm your identity now: bit.ly/4kZ9q",
    verdict: "danger" as const,
    score: 96,
    reason: "Urgency language + shortened link + impersonated sender",
  },
  {
    label: "Email",
    text: "From: billing@paypa1-support.com — Your payment could not be processed, update card details",
    verdict: "danger" as const,
    score: 91,
    reason: "Lookalike domain + spoofed brand + payment-detail request",
  },
  {
    label: "SMS",
    text: "Hi, your parcel (ref #88213) is out for delivery today between 2–4pm.",
    verdict: "safe" as const,
    score: 4,
    reason: "No links, no urgency, matches known courier pattern",
  },
];

const STEP_MS = 3600;

export function DemoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [phase, setPhase] = useState<"typing" | "scanning" | "result">("typing");

  const step = DEMO_STEPS[stepIndex];

  // reset when opened
  useEffect(() => {
    if (open) {
      setStepIndex(0);
      setTyped("");
      setPhase("typing");
    }
  }, [open]);

  // typing effect
  useEffect(() => {
    if (!open || phase !== "typing") return;
    if (typed.length < step.text.length) {
      const t = setTimeout(() => setTyped(step.text.slice(0, typed.length + 1)), 14);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setPhase("scanning"), 250);
    return () => clearTimeout(t);
  }, [open, phase, typed, step.text]);

  // scanning -> result
  useEffect(() => {
    if (!open || phase !== "scanning") return;
    const t = setTimeout(() => setPhase("result"), 900);
    return () => clearTimeout(t);
  }, [open, phase]);

  // advance to next step
  useEffect(() => {
    if (!open || phase !== "result") return;
    const t = setTimeout(() => {
      setStepIndex((i) => (i + 1) % DEMO_STEPS.length);
      setTyped("");
      setPhase("typing");
    }, STEP_MS);
    return () => clearTimeout(t);
  }, [open, phase]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center px-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-[#0B0F19]/70 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative w-full max-w-xl rounded-[28px] bg-[#0B0F19] border border-white/10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] overflow-hidden"
          >
            {/* top bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#4640DE] animate-pulse" />
                <span
                  className="text-[11px] tracking-[0.18em] uppercase text-white/50"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  Custos — live scan
                </span>
              </div>
              <button
                onClick={onClose}
                aria-label="Close demo"
                className="text-white/50 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* body */}
            <div className="p-6 md:p-8 min-h-[280px] flex flex-col justify-between">
              <div>
                <span
                  className="inline-block text-[10px] font-semibold tracking-[0.14em] uppercase text-white/40 border border-white/15 rounded-full px-2.5 py-1 mb-4"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {step.label} input
                </span>
                <p
                  className="text-[15px] md:text-[16px] leading-relaxed text-white/90 min-h-[72px]"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {typed}
                  {phase === "typing" && <span className="inline-block w-[2px] h-[15px] bg-[#4640DE] ml-0.5 align-middle animate-pulse" />}
                </p>
              </div>

              <div className="mt-8">
                {phase !== "typing" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className="text-[11px] tracking-[0.14em] uppercase text-white/40"
                        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                      >
                        Risk score
                      </span>
                      <span
                        className="text-[13px] font-semibold"
                        style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          color: step.verdict === "danger" ? "#FF5A5F" : "#3DDC97",
                        }}
                      >
                        {phase === "scanning" ? "—" : `${step.score}/100`}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: step.verdict === "danger" ? "#FF5A5F" : "#3DDC97" }}
                        initial={{ width: "0%" }}
                        animate={{ width: phase === "result" ? `${step.score}%` : "18%" }}
                        transition={{ duration: phase === "result" ? 0.6 : 0.9, ease: "easeOut" }}
                      />
                    </div>

                    {phase === "result" && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-2.5 pt-2"
                      >
                        {step.verdict === "danger" ? (
                          <ShieldAlert className="w-4 h-4 text-[#FF5A5F] flex-shrink-0 mt-0.5" />
                        ) : (
                          <ShieldCheck className="w-4 h-4 text-[#3DDC97] flex-shrink-0 mt-0.5" />
                        )}
                        <p className="text-[13px] text-white/60 leading-relaxed">{step.reason}</p>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </div>

              {/* step dots */}
              <div className="flex items-center gap-1.5 pt-6">
                {DEMO_STEPS.map((_, i) => (
                  <span
                    key={i}
                    className="h-[3px] rounded-full transition-all duration-300"
                    style={{
                      width: i === stepIndex ? 22 : 10,
                      background: i === stepIndex ? "#4640DE" : "rgba(255,255,255,0.15)",
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default DemoModal;