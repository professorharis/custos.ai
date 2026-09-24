import type { Scan } from '@/lib/db';
import type { ScamResult, SafetyTip } from '@/lib/types';

const RISK_LEVEL_MAP: Record<string, 'high' | 'medium' | 'low'> = {
  High: 'high',
  Medium: 'medium',
  Low: 'low',
};

const SCAN_TYPE_MAP: Record<string, 'email' | 'text' | 'url'> = {
  Email: 'email',
  Text: 'text',
  URL: 'url',
};

// Older saved scans may have safetyTips as a plain string[] in `details`.
// Normalize to the { headline, tip } shape the report page expects.
function normalizeSafetyTips(raw: unknown): SafetyTip[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, idx) => {
    if (typeof item === 'string') {
      return { headline: `Recommendation ${idx + 1}`, tip: item };
    }
    if (item && typeof item === 'object' && 'tip' in item) {
      return {
        headline: typeof (item as any).headline === 'string' ? (item as any).headline : `Recommendation ${idx + 1}`,
        tip: String((item as any).tip ?? ''),
      };
    }
    return { headline: `Recommendation ${idx + 1}`, tip: String(item) };
  });
}

/**
 * Converts a Supabase `scans` row into the ScamResult shape the /report
 * page consumes, and returns the input type the scanner originally used.
 * Falls back gracefully if `details` is missing fields (older rows).
 */
export function scanToReportData(scan: Scan): {
  result: ScamResult;
  inputContent: string;
  inputType: string;
} {
  const details = scan.details || {};
  const riskLevelRaw = scan.risk_level || scan.riskLevel || 'Low';

  const result: ScamResult = {
    scanId: details.scanId || `#SCY-${scan.id.slice(0, 5).toUpperCase()}`,
    riskScore: scan.risk_score ?? scan.riskScore ?? 0,
    riskLevel: RISK_LEVEL_MAP[riskLevelRaw] || 'low',
    explanation: details.explanation || 'No additional analysis details were saved for this scan.',
    safetyTips: normalizeSafetyTips(details.safetyTips),
    threatType: details.threatType,
    cvss: details.cvss,
    status: details.status,
    indicators: Array.isArray(details.indicators) ? details.indicators : undefined,
  };

  return {
    result,
    inputContent: scan.content || '',
    inputType: SCAN_TYPE_MAP[scan.type] || 'text',
  };
}