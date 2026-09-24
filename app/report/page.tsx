'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useScanResult } from '@/context/ScanResultContext';
import { Header } from '@/components/Header';
import { Check, Copy, Download, Loader2, RefreshCw, Share2 } from 'lucide-react';
import { getRiskLevelLabel } from '@/lib/scannerHelpers';
import { generatePDFReport } from '@/lib/generatePdfReport';
import { ReportDocument, buildReportDocumentData } from '@/components/ReportDocument';
import Link from 'next/link';

// ─── Simple inline footer ─────────────────────────────────────────────────────
function SimpleFooter() {
  return (
    <footer className="mt-8 pb-10 text-center">
      <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
        <Link href="/terms"   className="hover:text-slate-600 transition-colors">Terms & Conditions</Link>
        <span className="text-slate-300">·</span>
        <Link href="/privacy" className="hover:text-slate-600 transition-colors">Privacy Policy</Link>
        <span className="text-slate-300">·</span>
        <Link href="/support" className="hover:text-slate-600 transition-colors">Support</Link>
      </div>
    </footer>
  );
}

// ─── Main Report Page ─────────────────────────────────────────────────────────
export default function ReportPage() {
  const router = useRouter();
  const { result, inputContent, inputType } = useScanResult();
  const [copied, setCopied]         = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    if (!result) router.replace('/');
  }, [result, router]);

  if (!result) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <p className="text-slate-400 text-sm">No scan result found. Redirecting…</p>
      </div>
    );
  }

  const today         = new Date();
  const formattedTime = today.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const data = buildReportDocumentData(result, inputContent, inputType);
  const { reportId, cvss, campaignStatus, threatTypeLabel, targetBrand, indicators, safetyTips, formattedDate } = data;

  const handleCopyReport = () => {
    const report = [
      `Custos AI — Security Analysis Report`,
      `Report ID: ${reportId}`,
      `Date Generated: ${formattedDate}`,
      `Threat Type: ${threatTypeLabel}`,
      `Severity Level: ${getRiskLevelLabel(result.riskLevel)} (${cvss} CVSS Equivalent)`,
      `Target Brand: ${targetBrand}`,
      `Status: ${campaignStatus}`,
      '', `Executive Summary:`, result.explanation,
      '', `Intercepted Content:`, inputContent,
      '', `Technical Threat Indicators:`,
      ...indicators.flatMap((row) => [
        `- ${row.element}: ${row.value} [${row.assessment}]`,
        ...row.findings.map((f) => `    • ${f}`),
      ]),
      '', `Operational Recommendations:`,
      ...safetyTips.map((item) => `• ${item.headline}: ${item.tip}`),
    ].join('\n');

    navigator.clipboard.writeText(report).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      await generatePDFReport(
        { ...result, safetyTips },
        inputType,
        inputContent,
        formattedDate,
        indicators,
        reportId,
        cvss,
        campaignStatus,
        threatTypeLabel,
        targetBrand
      );
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Unable to generate PDF. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleShare = async () => {
    const shareText = `Scyra Security Report ${reportId}\nSeverity: ${getRiskLevelLabel(result.riskLevel)}\nStatus: ${campaignStatus}`;
    if (navigator.share) {
      await navigator.share({ title: 'Scyra AI Security Report', text: shareText, url: window.location.href });
    } else {
      await navigator.clipboard.writeText(shareText);
      alert('Report details copied to clipboard!');
    }
  };

  return (
    <>
      <Header />

      {/* White top section → fades to light gray — gives the page depth
          without a harsh background shift */}
      <main className="min-h-screen bg-gradient-to-b from-white to-slate-100 py-8 sm:py-10 px-4">
        <div className="max-w-4xl mx-auto space-y-5">

          {/* ── Action bar ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs sm:text-sm text-slate-500">
              Report{' '}
              <span className="font-bold text-slate-800">{reportId}</span>
              {' · '}generated {formattedDate} at {formattedTime}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleCopyReport}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium shadow-sm whitespace-nowrap transition"
              >
                {copied
                  ? <Check className="w-4 h-4 text-emerald-500" />
                  : <Copy className="w-4 h-4 text-slate-500" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={pdfLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium shadow-sm whitespace-nowrap transition disabled:opacity-60"
              >
                {pdfLoading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Download className="w-4 h-4" />}
                {pdfLoading ? 'Generating…' : 'PDF Report'}
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium shadow-sm whitespace-nowrap transition"
              >
                <Share2 className="w-4 h-4" /> Share
              </button>
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-lg text-sm font-bold shadow-sm whitespace-nowrap transition"
              >
                <RefreshCw className="w-4 h-4" /> New Scan
              </button>
            </div>
          </div>

          {/* ── Report document ── */}
          <ReportDocument
            result={result}
            inputContent={inputContent}
            inputType={inputType}
            data={data}
          />

          <div className="text-center pt-2">
            <button
              onClick={() => router.push('/')}
              className="text-blue-600 hover:text-blue-700 hover:underline text-sm transition-colors"
            >
              ← Back to Scanner
            </button>
          </div>
        </div>

        <SimpleFooter />
      </main>
    </>
  );
}