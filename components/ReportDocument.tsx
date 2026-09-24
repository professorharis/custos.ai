'use client';

import React from 'react';
import {
  getRiskLevelLabel,
  getThreatIndicators,
  getDossierReportId,
  getCvssEquivalent,
  getCampaignStatusLabel,
} from '@/lib/scannerHelpers';
import type { ScamResult, ThreatIndicator, SafetyTip, MetaRow as AIMetaRow } from '@/lib/types';

// ─── Helpers (fallback only — used when the AI didn't supply a value) ──────

function getTargetBrandFallback(content: string): string {
  const lower = content.toLowerCase();
  const brands: [string, string][] = [
    ['paypal',    'PayPal'],
    ['chase',     'JPMorgan Chase & Co.'],
    ['google',    'Google'],
    ['amazon',    'Amazon'],
    ['apple',     'Apple Inc.'],
    ['microsoft', 'Microsoft'],
    ['netflix',   'Netflix'],
    ['facebook',  'Meta / Facebook'],
    ['instagram', 'Meta / Instagram'],
    ['bank',      'Financial Institution'],
  ];
  for (const [key, label] of brands) if (lower.includes(key)) return label;
  return 'Unknown';
}

function normalizeTip(item: SafetyTip | string, idx: number): SafetyTip {
  if (typeof item === 'string') return { headline: `Recommendation ${idx + 1}`, tip: item };
  return item;
}

// ─── Scan‑type‑specific fallback helpers ────────────────────────────────────
// Only used when the AI response doesn't include a reportTitle / metaRows.

function getReportTitleFallback(inputType: string): string {
  switch (inputType) {
    case 'url':   return 'URL Threat Intelligence & Security Analysis Report';
    case 'email': return 'Email Phishing & Threat Intelligence Report';
    case 'sms':   return 'SMS / Smishing Threat Intelligence Report';
    default:      return 'Threat Intelligence & Security Analysis Report';
  }
}

function extractUrls(text: string): string[] {
  return text.match(/https?:\/\/[^\s"')>]+/g) ?? [];
}

function extractEmails(text: string): string[] {
  return text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) ?? [];
}

function extractPhones(text: string): string[] {
  return text.match(/\+?[\d\s\-().]{7,}/g)?.map((s) => s.trim()) ?? [];
}

interface MetaRow {
  l: string;
  lv: string;
  r: string;
  rv: string;
  rColored: boolean;
}

function buildScanMetaRowsFallback(
  inputContent: string,
  inputType: string,
  formattedDate: string,
): MetaRow[] {
  const urls   = extractUrls(inputContent);
  const emails = extractEmails(inputContent);
  const phones = extractPhones(inputContent);
  const words  = inputContent.trim().split(/\s+/).filter(Boolean).length;

  switch (inputType) {
    case 'url': {
      const rawUrl  = urls[0] ?? inputContent.trim();
      let domain    = rawUrl;
      let protocol  = 'Unknown';
      let ssl       = 'Unknown';
      try {
        const u  = new URL(rawUrl);
        domain   = u.hostname;
        protocol = u.protocol.replace(':', '').toUpperCase();
        ssl      = rawUrl.startsWith('https') ? 'Present' : 'Absent';
      } catch { /* non‑parseable URL */ }

      return [
        { l: 'URL',      lv: rawUrl.length > 55 ? rawUrl.slice(0, 52) + '…' : rawUrl,
          r: 'Domain',   rv: domain, rColored: false },
        { l: 'Protocol', lv: protocol,
          r: 'SSL',      rv: ssl,    rColored: ssl === 'Absent' },
        { l: 'Links Detected', lv: `${urls.length}`,
          r: 'Scan Date',      rv: formattedDate, rColored: false },
      ];
    }

    case 'email': {
      const senderMatch  = inputContent.match(/from[:\s]+([^\n\r<]+)/i);
      const subjectMatch = inputContent.match(/subject[:\s]+([^\n\r]+)/i);
      const sender  = senderMatch  ? senderMatch[1].trim()  : emails[0] ?? 'Not detected';
      const subject = subjectMatch ? subjectMatch[1].trim() : 'Not detected';
      const hasAttach = /attach|\.pdf|\.zip|\.docx|\.exe/i.test(inputContent);

      return [
        { l: 'Sender',      lv: sender,
          r: 'Subject',     rv: subject.length > 45 ? subject.slice(0, 42) + '…' : subject, rColored: false },
        { l: 'Links Found', lv: `${urls.length}`,
          r: 'Attachments', rv: hasAttach ? 'Detected' : 'None', rColored: hasAttach },
        { l: 'Emails Found', lv: `${emails.length}`,
          r: 'Scan Date',   rv: formattedDate, rColored: false },
      ];
    }

    case 'sms': {
      const sender = phones[0] ?? 'Unknown';
      return [
        { l: 'Sender / Number', lv: sender,
          r: 'Links Found',     rv: `${urls.length}`, rColored: urls.length > 0 },
        { l: 'Phone Numbers',   lv: `${phones.length}`,
          r: 'Message Length',  rv: `${inputContent.length} chars`, rColored: false },
        { l: 'Language',        lv: 'English',
          r: 'Scan Date',       rv: formattedDate, rColored: false },
      ];
    }

    default: /* text */ {
      return [
        { l: 'Word Count',     lv: `${words}`,
          r: 'Characters',     rv: `${inputContent.length}`, rColored: false },
        { l: 'URLs Found',     lv: `${urls.length}`,
          r: 'Emails Found',   rv: `${emails.length}`, rColored: false },
        { l: 'Phone Numbers',  lv: `${phones.length}`,
          r: 'Scan Date',      rv: formattedDate, rColored: false },
      ];
    }
  }
}

// Pairs the AI's flat list of {label, value} metaRows into the two-column
// layout the masthead table uses. Odd counts fall back to "Scan Date" for
// the trailing right-hand cell.
function pairAiMetaRows(aiRows: AIMetaRow[], formattedDate: string): MetaRow[] {
  const rows: MetaRow[] = [];
  for (let i = 0; i < aiRows.length; i += 2) {
    const left = aiRows[i];
    const right = aiRows[i + 1];
    rows.push({
      l: left.label,
      lv: left.value,
      r: right ? right.label : 'Scan Date',
      rv: right ? right.value : formattedDate,
      rColored: false,
    });
  }
  return rows;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReportDocumentData {
  reportId: string;
  cvss: string;
  campaignStatus: string;
  threatTypeLabel: string;
  targetBrand: string;
  indicators: ThreatIndicator[];
  safetyTips: SafetyTip[];
  formattedDate: string;
  scanMetaRows: MetaRow[];
  reportTitle: string;
}

export function buildReportDocumentData(
  result: ScamResult,
  inputContent: string,
  inputType: string,
): ReportDocumentData {
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
  const formattedTime = today.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
  const scanDateTime = `${formattedDate}, ${formattedTime}`;

  const indicators: ThreatIndicator[] = Array.isArray(result.indicators)
    ? result.indicators
    : getThreatIndicators(result.riskLevel, result.explanation, inputContent, inputType);

  const safetyTips: SafetyTip[] = Array.isArray(result.safetyTips)
    ? result.safetyTips.map((item, idx) => normalizeTip(item as any, idx))
    : [];

  const reportId        = getDossierReportId(result.scanId);
  const cvss            = result.cvss || getCvssEquivalent(result.riskScore);
  const campaignStatus  = result.status || getCampaignStatusLabel(result.riskLevel);
  const threatTypeLabel =
    result.threatType ||
    (inputType === 'url'    ? 'Malicious URL / Phishing Link'
    : inputType === 'sms'   ? 'Smishing (SMS Phishing) / Brand Impersonation'
    : inputType === 'email' ? 'Email Phishing / BEC'
    :                         'Social Engineering / Scam Text');

  // Prefer the AI's own title / brand / metadata — only fall back to local
  // heuristics if the model genuinely omitted them from its response.
  const reportTitle = result.reportTitle?.trim()
    ? result.reportTitle.trim()
    : getReportTitleFallback(inputType);

  const targetBrand = result.targetBrand?.trim()
    ? result.targetBrand.trim()
    : getTargetBrandFallback(inputContent + ' ' + result.explanation);

  const scanMetaRows: MetaRow[] =
    Array.isArray(result.metaRows) && result.metaRows.length > 0
      ? pairAiMetaRows(result.metaRows, scanDateTime)
      : buildScanMetaRowsFallback(inputContent, inputType, scanDateTime);

  return {
    reportId,
    cvss,
    campaignStatus,
    threatTypeLabel,
    targetBrand,
    indicators,
    safetyTips,
    formattedDate,
    scanMetaRows,
    reportTitle,
  };
}

// ─── Severity badge ──────────────────────────────────────────────────────────

function SeverityBadge({ riskLevel }: { riskLevel: string }) {
  const cfg = {
    high:   { label: 'CRITICAL THREAT', cls: 'bg-red-600 text-white' },
    medium: { label: 'ELEVATED RISK',   cls: 'bg-orange-500 text-white' },
    low:    { label: 'LOW RISK',        cls: 'bg-emerald-600 text-white' },
  } as const;
  const m = cfg[riskLevel as keyof typeof cfg] ?? cfg.low;
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded text-[11px] font-bold tracking-widest uppercase ${m.cls}`}>
      {m.label}
    </span>
  );
}

// ─── Assessment colour map (used only in the Assessment column) ────────────

const ASSESS_CLS: Record<string, string> = {
  MALICIOUS:           'text-red-600',
  FRAUDULENT:          'text-red-600',
  FABRICATED:          'text-red-600',
  'HIGH RISK':         'text-red-600',
  'STALKING / BLIND':  'text-orange-500',
  SUSPICIOUS:          'text-orange-500',
  INFORMATIONAL:       'text-slate-500',
};

// ─── Masthead ────────────────────────────────────────────────────────────────

function Masthead({ result, data }: { result: ScamResult; data: ReportDocumentData }) {
  const {
    reportId, cvss, campaignStatus,
    threatTypeLabel, targetBrand, formattedDate,
    scanMetaRows, reportTitle,
  } = data;

  const severityCls =
    result.riskLevel === 'high'   ? 'text-red-600 font-bold'
    : result.riskLevel === 'medium' ? 'text-orange-500 font-bold'
    : 'text-emerald-600 font-bold';

  const fixedRows = [
    { l: 'Report ID',    lv: reportId,        r: 'Date Generated', rv: formattedDate,    rColored: false },
    { l: 'Threat Type',  lv: threatTypeLabel, r: 'Severity Level', rv: `${getRiskLevelLabel(result.riskLevel)} (${cvss} CVSS Equivalent)`, rColored: true },
    { l: 'Target Brand', lv: targetBrand,     r: 'Status',         rv: campaignStatus,   rColored: true },
  ];

  const allRows = [...fixedRows, ...scanMetaRows];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 pb-4 border-b-2 border-slate-700">
        <div>
          <div className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-none">
            Custos AI
          </div>
        </div>
        <SeverityBadge riskLevel={result.riskLevel} />
      </div>

      <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
        {reportTitle}
      </h1>

      <div className="border border-slate-300 rounded-lg overflow-hidden text-xs sm:text-sm divide-y divide-slate-200">
        {allRows.map((row, i) => (
          <div
            key={i}
            className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 divide-slate-200"
          >
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 px-4 py-3 min-w-0 sm:border-r border-slate-200">
              <span className="text-slate-500 whitespace-nowrap shrink-0">{row.l}</span>
              <span className="text-slate-900 font-bold break-words min-w-0">{row.lv}</span>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 px-4 py-3 min-w-0">
              <span className="text-slate-500 whitespace-nowrap shrink-0">{row.r}</span>
              <span className={`font-bold break-words min-w-0 ${row.rColored ? severityCls : 'text-slate-900'}`}>
                {row.rv}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Executive Summary ──────────────────────────────────────────────────────

function ExecutiveSummary({ result }: { result: ScamResult }) {
  const isLow = result.riskLevel === 'low';
  const s = isLow
    ? { wrap: 'bg-emerald-50 border-l-4 border-emerald-500', title: 'text-emerald-700' }
    : { wrap: 'bg-red-50 border-l-4 border-red-500',         title: 'text-red-700' };

  return (
    <div className={`rounded-r-lg px-5 py-4 ${s.wrap}`}>
      <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${s.title}`}>
        Executive Summary
      </div>
      <p className="text-sm text-slate-700 leading-relaxed break-words">{result.explanation}</p>
    </div>
  );
}

// ─── Section 1: Intercepted Content ─────────────────────────────────────────

function InterceptedContent({ inputContent, inputType }: { inputContent: string; inputType: string }) {
  return (
    <section className="space-y-3">
      <SectionHeading n={1} title="Intercepted Content Analysis" />
      <p className="text-sm text-slate-600">
        {inputType === 'url'
          ? 'The malicious artifact consists of the following URL submitted for analysis:'
          : `The malicious artifact consists of the following ${inputType === 'sms' ? 'SMS text string' : 'message content'} transmitted to the target device:`}
      </p>
      <div className="bg-slate-900 text-blue-100 rounded-lg p-4 font-mono text-xs sm:text-sm break-all whitespace-pre-wrap leading-relaxed">
        {inputContent || '(no content provided)'}
      </div>
    </section>
  );
}

// ─── Section 2: Threat Indicators ──────────────────────────────────────────

// UPDATED FindingsList – clean bullet, heading bold, body normal, NO extra risk line
function FindingsList({
  findings,
}: {
  findings: string[];
}) {
  return (
    <ul className="space-y-2.5">
      {findings.map((f, fi) => {
        const ci   = f.indexOf(':');
        const hasHeading = ci > 0 && ci < 55;
        const heading = hasHeading ? f.slice(0, ci + 1) : null;
        const body    = hasHeading ? f.slice(ci + 1).trim() : f;

        return (
          <li key={fi} className="flex gap-2 text-[12.5px] leading-relaxed">
            <span className="text-slate-900 font-black flex-shrink-0 leading-5 mt-0.5">•</span>
            <span className="break-words min-w-0">
              {heading && (
                <span className="font-bold text-slate-900 mr-1">{heading}</span>
              )}
              <span className="text-slate-700">{body}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function IndicatorsTable({ indicators }: { indicators: ThreatIndicator[] }) {
  if (!indicators.length) {
    return (
      <section className="space-y-3">
        <SectionHeading n={2} title="Technical Threat Indicators &amp; Breakdown" />
        <p className="text-sm text-slate-500 border border-slate-200 rounded-lg p-4">
          No high‑confidence technical indicators were extracted from this content.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <SectionHeading n={2} title="Technical Threat Indicators &amp; Breakdown" />

      {/* Desktop table */}
      <div className="hidden sm:block border border-slate-300 rounded-lg overflow-hidden">
        <table className="w-full text-sm table-fixed">
          <colgroup>
            <col style={{ width: '26%' }} />
            <col style={{ width: '22%' }} />
            <col />
          </colgroup>
          <thead>
            <tr className="bg-slate-900 text-white text-xs">
              <th className="text-left font-bold px-4 py-3 tracking-wide">Element Analyzed</th>
              <th className="text-left font-bold px-3 py-3 tracking-wide border-l border-slate-700">Assessment</th>
              <th className="text-left font-bold px-4 py-3 tracking-wide border-l border-slate-700">
                Technical Context &amp; Findings
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {indicators.map((row, idx) => (
              <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                <td className="align-top px-4 py-4 border-r border-slate-200">
                  <div className="font-bold text-slate-900 text-[13px] leading-snug break-words">
                    {row.element}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 break-all leading-relaxed">
                    {row.value}
                  </div>
                </td>
                <td className="align-top px-3 py-4 border-r border-slate-200">
                  <span className={`font-bold text-[11px] leading-snug uppercase tracking-wide ${ASSESS_CLS[row.assessment] ?? 'text-slate-500'}`}>
                    {row.assessment}
                  </span>
                </td>
                <td className="align-top px-4 py-4">
                  <FindingsList findings={row.findings} />
                  {/* EXTRA RISK LINE REMOVED – matches your exact table layout */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {indicators.map((row, idx) => (
          <div key={idx} className="border border-slate-300 rounded-lg overflow-hidden">
            <div className="bg-slate-900 px-4 py-3 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <span className="font-bold text-[13px] text-white leading-snug break-words flex-1 min-w-0">
                  {row.element}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wide flex-shrink-0 px-2 py-0.5 rounded bg-white/10 whitespace-nowrap ${ASSESS_CLS[row.assessment] ?? 'text-slate-300'}`}>
                  {row.assessment}
                </span>
              </div>
              {row.value && (
                <div className="text-[11px] text-slate-400 break-all leading-relaxed">
                  {row.value}
                </div>
              )}
            </div>
            <div className="bg-white px-4 py-3">
              <FindingsList findings={row.findings} />
              {/* EXTRA RISK LINE REMOVED – matches your exact table layout */}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Section 3: Recommendations ────────────────────────────────────────────

function Recommendations({ safetyTips }: { safetyTips: SafetyTip[] }) {
  return (
    <section className="space-y-3">
      <SectionHeading n={3} title="Operational Recommendations &amp; Incident Mitigation" />
      <ul className="space-y-3">
        {safetyTips.map((item, idx) => (
          <li key={idx} className="flex gap-2 text-sm leading-relaxed">
            <span className="font-black text-slate-900 flex-shrink-0 leading-5">•</span>
            <span className="break-words min-w-0">
              <span className="font-bold text-slate-900">{item.headline}:</span>{' '}
              <span className="text-slate-700">{item.tip}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function DossierFooter() {
  return (
    <div className="pt-4 flex justify-center text-[11px] text-slate-400">
      <span>Generated by Custos AI</span>
    </div>
  );
}

// ─── Shared section heading ───────────────────────────────────────────────────

function SectionHeading({ n, title }: { n: number; title: string }) {
  return (
    <h2
      className="text-sm sm:text-[15px] font-bold text-slate-900 border-l-4 border-blue-600 pl-3 leading-snug"
      dangerouslySetInnerHTML={{ __html: `${n}. ${title}` }}
    />
  );
}

// ─── Public component ─────────────────────────────────────────────────────────

interface ReportDocumentProps {
  result: ScamResult;
  inputContent: string;
  inputType: string;
  data?: ReportDocumentData;
  /**
   * When true, hides any in-component download control. ReportPanel passes
   * this because it renders its own Download button in the panel header
   * and handles the PDF generation itself — the embedded <ReportDocument />
   * should not show a second, redundant download button.
   */
  hideDownload?: boolean;
}

export function ReportDocument({
  result,
  inputContent,
  inputType,
  data,
  // Accepted for API compatibility with ReportPanel, which renders its own
  // download button and passes `hideDownload` to suppress any duplicate here.
  // This component currently renders no download control of its own, so the
  // flag is intentionally unused — prefixed with `_` to signal that to
  // ESLint's no-unused-vars rule.
  hideDownload: _hideDownload,
}: ReportDocumentProps) {
  const doc = data ?? buildReportDocumentData(result, inputContent, inputType);
  return (
    <div className="p-1 sm:p-2 space-y-7">
      <Masthead result={result} data={doc} />
      <ExecutiveSummary result={result} />
      <InterceptedContent inputContent={inputContent} inputType={inputType} />
      <IndicatorsTable indicators={doc.indicators} />
      <Recommendations safetyTips={doc.safetyTips} />
      <DossierFooter />
    </div>
  );
}

export function getReportPageBlocks(
  result: ScamResult,
  inputContent: string,
  inputType: string,
  data?: ReportDocumentData,
): React.ReactNode[] {
  const doc = data ?? buildReportDocumentData(result, inputContent, inputType);
  return [
    <div key="p1" className="space-y-6">
      <Masthead result={result} data={doc} />
      <ExecutiveSummary result={result} />
    </div>,
    <div key="p2" className="space-y-6">
      <InterceptedContent inputContent={inputContent} inputType={inputType} />
      <IndicatorsTable indicators={doc.indicators} />
    </div>,
    <div key="p3" className="space-y-6">
      <Recommendations safetyTips={doc.safetyTips} />
      <DossierFooter />
    </div>,
  ];
}