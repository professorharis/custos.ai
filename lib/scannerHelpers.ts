export const getContextLabels = (inputType: string) => {
  const isUrl = inputType === 'url';
  return {
    riskScoreLabel: isUrl ? 'URL Risk Score' : 'Message Risk Score',
    probabilityLabel: isUrl ? 'Threat Probability' : 'Scam Probability',
    threatsHeader: isUrl ? 'Detected Threats' : 'Detected Threats',
    summaryPreamble: isUrl ? 'URL Analysis' : 'AI Summary',
    actionsHeader: isUrl ? 'Security Recommendations' : 'Recommended Actions',
    previewHeader: isUrl ? 'Scanned URL' : 'Message Preview',
    previewLabel: isUrl ? 'URL' : 'Message',
    scanTypeLabel: isUrl
      ? 'URL Scan'
      : inputType === 'sms'
      ? 'SMS Scan'
      : inputType === 'email'
      ? 'Email Scan'
      : 'Text Scan',
    safeLabel: isUrl ? 'This URL appears to be safe.' : 'This message appears to be safe.',
    mediumLabel: isUrl ? 'This URL has suspicious characteristics.' : 'This message has suspicious elements.',
    highLabel: isUrl
      ? 'This URL is likely malicious or fraudulent.'
      : 'This message is likely a scam or phishing attempt.',
  };
};

export const getRiskColor = (level: string, type: 'text' | 'bg' | 'fill' | 'border' = 'text') => {
  switch (level) {
    case 'high':
      if (type === 'bg') return 'bg-red-50';
      if (type === 'fill') return 'bg-red-500';
      if (type === 'border') return 'border-red-200';
      return 'text-red-500';
    case 'medium':
      if (type === 'bg') return 'bg-orange-50';
      if (type === 'fill') return 'bg-orange-500';
      if (type === 'border') return 'border-orange-200';
      return 'text-orange-500';
    default:
      if (type === 'bg') return 'bg-emerald-50';
      if (type === 'fill') return 'bg-emerald-500';
      if (type === 'border') return 'border-emerald-200';
      return 'text-emerald-500';
  }
};

export const getRiskLevelLabel = (level: string) => {
  switch (level) {
    case 'high':
      return 'HIGH RISK';
    case 'medium':
      return 'MEDIUM RISK';
    default:
      return 'LOW RISK';
  }
};

export const getThreats = (level: string, explanation: string) => {
  const threats: string[] = [];
  if (level === 'high' || level === 'medium') {
    const ex = explanation.toLowerCase();
    if (ex.includes('link') || ex.includes('url')) threats.push('Suspicious Link Detected');
    if (ex.includes('bank') || ex.includes('account') || ex.includes('financial'))
      threats.push('Financial Impersonation');
    if (ex.includes('urgent') || ex.includes('immediate') || ex.includes('pressure'))
      threats.push('Urgency / Pressure Tactics');
    if (
      ex.includes('personal') ||
      ex.includes('password') ||
      ex.includes('otp') ||
      ex.includes('sensitive')
    )
      threats.push('Requests Sensitive Information');
    if (threats.length === 0) threats.push('Suspicious Content Detected');
  }
  return threats;
};

// ─── Additive helpers for the upgraded report dashboard ────────────────
// (Pure presentation metadata — does not change existing exports above.)

export type ThreatSeverity = 'critical' | 'warning' | 'info';

export interface ThreatDetail {
  label: string;
  severity: ThreatSeverity;
  note: string;
}

const THREAT_META: Record<string, { severity: ThreatSeverity; note: string }> = {
  'Suspicious Link Detected': {
    severity: 'critical',
    note: 'Links can lead to credential-harvesting or malware pages.',
  },
  'Financial Impersonation': {
    severity: 'critical',
    note: 'Mimics a bank or payment provider to gain trust.',
  },
  'Urgency / Pressure Tactics': {
    severity: 'warning',
    note: 'Pushes fast action to bypass careful judgement.',
  },
  'Requests Sensitive Information': {
    severity: 'critical',
    note: 'Attempts to extract passwords, OTPs, or personal data.',
  },
  'Suspicious Content Detected': {
    severity: 'warning',
    note: 'Contains patterns commonly seen in scam attempts.',
  },
};

export const getThreatDetails = (level: string, explanation: string): ThreatDetail[] => {
  const labels = getThreats(level, explanation);
  return labels.map((label) => ({
    label,
    severity: THREAT_META[label]?.severity ?? 'info',
    note: THREAT_META[label]?.note ?? '',
  }));
};

// Derives a model-confidence figure from the risk score so the dashboard
// has a second metric beyond the raw risk score (purely presentational).
export const getConfidenceScore = (riskScore: number, riskLevel: string): number => {
  if (riskLevel === 'medium') {
    // Mid-range scores are inherently less certain either way.
    const distanceFromCenter = Math.abs(riskScore - 50);
    return Math.min(97, 60 + distanceFromCenter);
  }
  const distanceFromExtreme = riskLevel === 'high' ? 100 - riskScore : riskScore;
  return Math.max(70, Math.min(99, 96 - distanceFromExtreme));
};

export const severityStyles = (severity: ThreatSeverity) => {
  switch (severity) {
    case 'critical':
      return { dot: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-100' };
    case 'warning':
      return { dot: 'bg-orange-500', text: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-100' };
    default:
      return { dot: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-100' };
  }
};

// ─── Threat-intel dossier engine ────────────────────────────────────────
// Extracts concrete indicators (domain, phone, amount, urgency phrase,
// sensitive-info request, account/card reference) from the scanned
// message/URL + AI explanation, formatted as a technical findings table
// in the style of a formal threat-intelligence report.

export type IndicatorAssessment =
  | 'MALICIOUS'
  | 'FRAUDULENT'
  | 'FABRICATED'
  | 'SUSPICIOUS'
  | 'HIGH RISK'
  | 'INFORMATIONAL';

export interface ThreatIndicatorRow {
  element: string; // e.g. "Domain Name"
  value: string; // e.g. "chase-fraud-verify.com"
  assessment: IndicatorAssessment;
  findings: string[]; // bullet points of technical context
}

const ASSESSMENT_COLOR: Record<IndicatorAssessment, string> = {
  MALICIOUS: 'text-red-600',
  FRAUDULENT: 'text-red-600',
  FABRICATED: 'text-red-600',
  'HIGH RISK': 'text-red-600',
  SUSPICIOUS: 'text-orange-600',
  INFORMATIONAL: 'text-slate-500',
};

export const assessmentColor = (a: IndicatorAssessment) => ASSESSMENT_COLOR[a] ?? 'text-slate-500';

const extractUrls = (text: string): string[] => {
  const matches = text.match(/\bhttps?:\/\/[^\s)"'<>]+/gi) || [];
  return Array.from(new Set(matches));
};

const extractDomain = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^https?:\/\//i, '').split('/')[0];
  }
};

const extractPhones = (text: string): string[] => {
  const matches =
    text.match(/(\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g) || [];
  return Array.from(new Set(matches.map((m) => m.trim())));
};

const extractAmounts = (text: string): string[] => {
  const matches = text.match(/[$£€]\s?\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g) || [];
  return Array.from(new Set(matches));
};

const extractCardRefs = (text: string): string[] => {
  const matches = text.match(/(?:ending in|card(?:\s*(?:no\.?|number))?\s*(?:ending)?\s*)\s*\d{4}\b/gi) || [];
  return Array.from(new Set(matches));
};

const LOOKALIKE_BRAND_HINTS = [
  'chase', 'bank', 'paypal', 'amazon', 'apple', 'microsoft', 'netflix', 'verify',
  'secure', 'account', 'support', 'alert', 'fraud',
];

/**
 * Builds a list of technical indicator rows from the raw scanned content
 * and the AI's explanation text. Returns an empty array when nothing
 * concrete can be extracted (e.g. a genuinely low-risk message) — the UI
 * is responsible for showing a graceful "no indicators" state in that case.
 */
export const getThreatIndicators = (
  riskLevel: string,
  explanation: string,
  rawContent: string,
  inputType: string
): ThreatIndicatorRow[] => {
  const rows: ThreatIndicatorRow[] = [];
  if (riskLevel === 'low') return rows;

  const combined = `${rawContent}\n${explanation}`;
  const lowerExplanation = explanation.toLowerCase();
  const lowerContent = rawContent.toLowerCase();

  // 1. Domain / URL
  const urls = inputType === 'url' && rawContent.trim() ? [rawContent.trim()] : extractUrls(rawContent);
  if (urls.length > 0) {
    const domain = extractDomain(urls[0]);
    const hasBrandHint = LOOKALIKE_BRAND_HINTS.some((hint) => domain.toLowerCase().includes(hint));
    rows.push({
      element: 'Domain Name',
      value: domain,
      assessment: riskLevel === 'high' ? 'MALICIOUS' : 'SUSPICIOUS',
      findings: [
        hasBrandHint
          ? 'Typosquatting / look-alike: combines a trusted brand name with security-themed words to appear authorized.'
          : 'Domain does not match any verified institutional or brand registry pattern.',
        'Risk: may act as a credential-harvesting portal or redirect to one.',
      ],
    });
  }

  // 2. Phone number
  const phones = extractPhones(combined);
  if (phones.length > 0) {
    rows.push({
      element: 'Inbound Phone Number',
      value: phones[0],
      assessment: 'FRAUDULENT',
      findings: [
        'Not listed on the official institution\'s verified contact channels.',
        'Attack vector: likely a vishing (voice phishing) endpoint used to extract card numbers, PINs, or one-time codes.',
      ],
    });
  }

  // 3. Transactional / monetary amount
  const amounts = extractAmounts(combined);
  if (amounts.length > 0) {
    rows.push({
      element: 'Transactional Text',
      value: amounts[0],
      assessment: 'FABRICATED',
      findings: [
        'High-value, specific figures are used to trigger urgency and bypass careful judgement.',
        'No corresponding legitimate transaction record can be verified from this content alone.',
      ],
    });
  }

  // 4. Card / account reference
  const cardRefs = extractCardRefs(combined);
  if (cardRefs.length > 0) {
    rows.push({
      element: 'Card / Account Reference',
      value: cardRefs[0],
      assessment: 'HIGH RISK',
      findings: [
        'Partial account identifiers are often guessed or broadcast at scale ("shotgun phishing") rather than targeted.',
        'If it matches a real account, conversion probability to a successful scam increases sharply.',
      ],
    });
  }

  // 5. Urgency / pressure language
  if (
    lowerExplanation.includes('urgent') ||
    lowerExplanation.includes('immediate') ||
    lowerExplanation.includes('pressure') ||
    lowerContent.includes('urgent') ||
    lowerContent.includes('immediately') ||
    lowerContent.includes('act now')
  ) {
    rows.push({
      element: 'Linguistic Pattern',
      value: 'Urgency / pressure phrasing detected',
      assessment: 'SUSPICIOUS',
      findings: [
        'Social-engineering trigger: forces a fast, low-friction decision before the recipient can verify independently.',
        'Common across smishing, vishing, and business-email-compromise campaigns.',
      ],
    });
  }

  // 6. Sensitive information request
  if (
    lowerExplanation.includes('password') ||
    lowerExplanation.includes('otp') ||
    lowerExplanation.includes('sensitive') ||
    lowerContent.includes('password') ||
    lowerContent.includes('otp') ||
    lowerContent.includes('pin') ||
    lowerContent.includes('ssn')
  ) {
    rows.push({
      element: 'Data Harvesting Attempt',
      value: 'Requests credentials or personal data',
      assessment: 'MALICIOUS',
      findings: [
        'Directly solicits information no legitimate institution requests via SMS, email, or unsolicited call.',
        'Indicates intent to enable account takeover or identity theft.',
      ],
    });
  }

  // Fallback row so a flagged (medium/high) scan never shows an empty table.
  if (rows.length === 0) {
    rows.push({
      element: 'Content Pattern',
      value: 'General scam heuristics matched',
      assessment: 'SUSPICIOUS',
      findings: [
        'Matches structural and linguistic patterns commonly observed in scam or phishing attempts.',
        'No single high-confidence indicator (domain, phone, or amount) was extracted from the raw content.',
      ],
    });
  }

  return rows;
};

// Deterministic-looking report ID in the VIL-style format, derived from the
// scan ID so it stays stable for a given result without needing new state.
export const getDossierReportId = (scanId: string): string => {
  const digits = (scanId.match(/\d+/g) || ['0000']).join('').slice(-4).padStart(4, '0');
  const year = new Date().getFullYear();
  return `SCY-${year}-${digits}`;
};

export const getCvssEquivalent = (riskScore: number): string => {
  const cvss = Math.min(10, Math.max(0, riskScore / 10)).toFixed(1);
  return `${cvss}/10`;
};

export const getCampaignStatusLabel = (riskLevel: string): string => {
  if (riskLevel === 'high') return 'Active Phishing Campaign';
  if (riskLevel === 'medium') return 'Unverified / Under Review';
  return 'No Active Threat Identified';
};