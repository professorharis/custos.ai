import { getRiskLevelLabel } from '@/lib/scannerHelpers';
import type { ScamResult, ThreatIndicator, SafetyTip } from '@/lib/types';

// ─── Color palette ───────
type RGB = [number, number, number];
const C = {
  white:       [255, 255, 255] as RGB,
  ink:         [17,  24,  39 ] as RGB,
  slate700:    [55,  65,  81 ] as RGB,
  slate600:    [71,  85,  105] as RGB,
  slate500:    [107, 114, 128] as RGB,
  slate400:    [148, 163, 184] as RGB,
  slate300:    [209, 213, 219] as RGB,
  slate200:    [226, 232, 240] as RGB,
  slate100:    [243, 244, 246] as RGB,
  slate50:     [248, 250, 252] as RGB,
  codeBg:      [15,  23,  42 ] as RGB,
  codeText:    [219, 234, 254] as RGB,
  blue600:     [37,  99,  235] as RGB,
  red600:      [220, 38,  38 ] as RGB,
  red700:      [185, 28,  28 ] as RGB,
  red100:      [254, 226, 226] as RGB,
  red50:       [254, 242, 242] as RGB,
  red200:      [254, 202, 202] as RGB,
  orange500:   [249, 115, 22 ] as RGB,
  orange600:   [234, 88,  12 ] as RGB,
  orange100:   [255, 237, 213] as RGB,
  emerald600:  [5,   150, 105] as RGB,
  emerald700:  [4,   120, 87 ] as RGB,
  emerald50:   [236, 253, 245] as RGB,
  emerald200:  [167, 243, 208] as RGB,
};

function assessColor(assessment: string): RGB {
  const a = assessment.toUpperCase();
  if (['MALICIOUS','FRAUDULENT','FABRICATED','HIGH RISK'].includes(a)) return C.red600;
  if (['STALKING / BLIND','SUSPICIOUS'].includes(a)) return C.orange600;
  return C.slate500;
}

function assessPillColors(assessment: string): { bg: RGB; text: RGB; border: RGB } {
  const a = assessment.toUpperCase();
  if (['MALICIOUS','FRAUDULENT','FABRICATED','HIGH RISK'].includes(a))
    return { bg: C.red100, text: C.red700, border: C.red200 };
  if (['STALKING / BLIND','SUSPICIOUS'].includes(a))
    return { bg: C.orange100, text: C.orange600, border: C.orange500 };
  return { bg: C.slate100, text: C.slate500, border: C.slate300 };
}

/**
 * Options for how the generated PDF should be delivered.
 *  - save (default true): triggers doc.save(...) -> browser download.
 *  - returnBlob (default false): resolves the function with a Blob instead
 *    (used by ReportViewerModal to preview the PDF in an <iframe>).
 * When returnBlob is true, `save` is ignored (the caller owns the blob).
 */
export interface GeneratePdfReportOptions {
  save?: boolean;
  returnBlob?: boolean;
}

export async function generatePDFReport(
  result:          ScamResult,
  inputType:       string,
  message:         string,
  scanDate:        string,   // kept for API compat; we regenerate real time internally
  indicators:      ThreatIndicator[],
  reportId:        string,
  cvss:            string,
  campaignStatus:  string,
  threatTypeLabel: string,
  targetBrand:     string,
  options: GeneratePdfReportOptions = {},
): Promise<Blob | void> {
  const { save = true, returnBlob = false } = options;

  const { jsPDF } = await import('jspdf');

  const doc      = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const PW       = doc.internal.pageSize.getWidth();
  const PH       = doc.internal.pageSize.getHeight();
  const ML       = 52;
  const MR       = 52;
  const CW       = PW - ML - MR;
  const FOOTER_H = 40;
  const BOTTOM   = PH - FOOTER_H - 12;

  const isHigh   = result.riskLevel === 'high';
  const isMedium = result.riskLevel === 'medium';
  const isLow    = result.riskLevel === 'low';

  const severityColor = C.white;
  const severityBg    = isHigh ? C.red600  : isMedium ? C.orange500 : C.emerald600;
  const severityBrd   = isHigh ? C.red700  : isMedium ? C.orange600 : C.emerald700;
  const severityLabel = isHigh ? 'HIGH RISK' : isMedium ? 'ELEVATED RISK' : 'LOW RISK';

  const severityMetaColor = isHigh ? C.red600 : isMedium ? C.orange600 : C.emerald600;

  const now       = new Date();
  const realDate  = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const realTime  = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const scanDateTime = `${realDate}, ${realTime}`;

  let y       = 56;
  let pageNum = 1;

  // ── Helper Functions ──
  const txt = (str: string, x: number, yy: number, opts: any = {}): number => {
    const { size = 10, color = C.slate700, weight = 'normal', font = 'helvetica', align = 'left', maxW, lhf = 1.4 } = opts;
    doc.setFontSize(size);
    // FIX: `color` was widening to `number[]` (not a fixed-length tuple)
    // because it's destructured from an `any`-typed `opts` with a default
    // value, which TS can't keep as `RGB` through the spread. Cast it back
    // to `RGB` explicitly so `...color` satisfies jsPDF's setTextColor
    // overloads (fixes "A spread argument must either have a tuple type...").
    doc.setTextColor(...(color as RGB));
    doc.setFont(font, weight);
    if (maxW) {
      const lines = doc.splitTextToSize(str, maxW);
      doc.text(lines, x, yy, { align, lineHeightFactor: lhf });
      return lines.length;
    }
    doc.text(str, x, yy, { align });
    return 1;
  };

  const textH = (str: string, maxW: number, size = 10, lhf = 1.4): number => {
    doc.setFontSize(size);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(str, maxW);
    return lines.length * size * lhf;
  };

  // FIX: jsPDF's doc.text(...) options type (TextOptionsLight) has no
  // `maxW` property — that was never a real jsPDF option; it only worked
  // inside the `txt()` helper above because `txt()` manually calls
  // splitTextToSize() itself. For the two meta-table value cells (which
  // are meant to stay on a single line and just get shortened if they're
  // too wide), truncate the string to what actually fits first, then call
  // doc.text() with no maxW option at all.
  const fitSingleLine = (str: string, maxW: number): string => {
    const lines = doc.splitTextToSize(str, maxW);
    return lines[0] ?? str;
  };

  const hRule = (x1: number, yy: number, x2: number, color: RGB = C.slate300, lw = 0.5) => {
    doc.setDrawColor(...color);
    doc.setLineWidth(lw);
    doc.line(x1, yy, x2, yy);
  };

  // ── NEW: Ensure space on current page; if not enough, start new page ──
  const ensureSpace = (needed: number) => {
    if (y + needed > BOTTOM) {
      newPage();
    }
  };

  const newPage = () => {
    const fy = PH - FOOTER_H + 12;
    hRule(ML, fy - 12, PW - MR, C.slate200);
    txt('Custos Security Analysis Report', ML, fy + 6, { size: 8, color: C.slate400, align: 'left' });
    txt(`Page ${pageNum}`, PW - MR, fy + 6, { size: 8, color: C.slate400, align: 'right' });
    doc.addPage();
    pageNum++;
    y = 56;
  };

  const drawSectionHeading = (n: number, title: string) => {
    // Ensure heading + its content will have space? Actually we call ensureSpace separately.
    // This just draws the heading and advances y.
    doc.setFillColor(...C.blue600);
    doc.rect(ML, y, 3, 16, 'F');
    txt(`${n}. ${title}`, ML + 10, y + 13, { size: 12.5, color: C.ink, weight: 'bold', maxW: CW - 14 });
    y += 28;
  };

  // ════════════════════════════════════════════════════════════════════════════
  // 1. MASTHEAD (always fits)
  // ════════════════════════════════════════════════════════════════════════════
  txt('Custos AI', ML, y + 10, { size: 19, color: C.ink, weight: 'bold' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  const bw = doc.getTextWidth(severityLabel) + 24;
  const bx = PW - MR - bw;
  const by = y - 4;
  doc.setFillColor(...severityBg);
  doc.setDrawColor(...severityBrd);
  doc.setLineWidth(0.6);
  doc.roundedRect(bx, by, bw, 22, 4, 4, 'FD');
  doc.setTextColor(...severityColor);
  doc.text(severityLabel, bx + 12, by + 15);

  y += 28;
  hRule(ML, y, PW - MR, C.ink, 1.5);
  y += 22;

  txt('Threat Intelligence & Security Analysis Report', ML, y, { size: 16.5, color: C.ink, weight: 'bold', maxW: CW });
  y += 26;

  // ── 3-row meta table ──
  const META_ROW_H = 36;
  const META_ROWS  = 3;
  const META_H     = META_ROW_H * META_ROWS;
  const META_COL   = ML + CW * 0.5;
  const META_INNER = 14;

  ensureSpace(META_H + 10);
  const metaY = y;
  doc.setDrawColor(...C.slate300);
  doc.setLineWidth(0.5);
  doc.roundedRect(ML, metaY, CW, META_H, 6, 6, 'S');

  for (let i = 1; i < META_ROWS; i++) {
    hRule(ML, metaY + i * META_ROW_H, ML + CW, C.slate200);
  }
  doc.setDrawColor(...C.slate200);
  doc.line(META_COL, metaY, META_COL, metaY + META_H);

  const metaRowsData = [
    { lLabel: 'Report ID',    lv: reportId,                 rLabel: 'Date Generated', rv: scanDateTime,  rCol: false },
    { lLabel: 'Scan Subject', lv: inputType.toUpperCase(),  rLabel: 'Severity Level', rv: `${getRiskLevelLabel(result.riskLevel)} (${cvss} CVSS)`, rCol: true },
    { lLabel: 'Target Brand', lv: targetBrand,              rLabel: 'Campaign Status', rv: campaignStatus, rCol: true },
  ];

  metaRowsData.forEach(({ lLabel, lv, rLabel, rv, rCol }, ri) => {
    const ry     = metaY + ri * META_ROW_H;
    const labelY = ry + 22;

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.slate500);
    const lLabelX = ML + META_INNER;
    doc.text(lLabel, lLabelX, labelY);
    const lLabelW = doc.getTextWidth(lLabel);

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.ink);
    // FIX: truncate to fit instead of passing an invalid `maxW` option.
    const lvAvailW = META_COL - (lLabelX + lLabelW + 6) - META_INNER;
    doc.text(fitSingleLine(lv, lvAvailW), lLabelX + lLabelW + 6, labelY);

    if (rLabel) {
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...C.slate500);
      const rLabelX = META_COL + META_INNER;
      doc.text(rLabel, rLabelX, labelY);
      const rLabelW = doc.getTextWidth(rLabel);

      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...(rCol ? severityMetaColor : C.ink));
      // FIX: same truncation approach for the right-hand value cell.
      const rvAvailW = (ML + CW) - (rLabelX + rLabelW + 6) - META_INNER;
      doc.text(fitSingleLine(rv, rvAvailW), rLabelX + rLabelW + 6, labelY);
    }
  });

  y = metaY + META_H + 26;

  // ════════════════════════════════════════════════════════════════════════════
  // 2. EXECUTIVE SUMMARY – whole section moved if not enough space
  // ════════════════════════════════════════════════════════════════════════════
  const sumAccent = isLow ? C.emerald600 : C.red600;
  const sumBg     = isLow ? C.emerald50  : C.red50;
  const sumBrd    = isLow ? C.emerald200 : C.red200;

  const sumInner = 16;
  const sumTextW = CW - sumInner - 12;
  const sumH     = textH(result.explanation, sumTextW, 10, 1.5) + 40;

  // Heading + content
  ensureSpace(28 + sumH); // heading height ≈ 28
  drawSectionHeading(1, 'Executive Summary');

  doc.setFillColor(...sumBg);
  doc.setDrawColor(...sumBrd);
  doc.setLineWidth(0.5);
  doc.roundedRect(ML, y, CW, sumH, 4, 4, 'FD');

  doc.setFillColor(...sumAccent);
  doc.rect(ML, y, 4, sumH, 'F');

  txt('EXECUTIVE SUMMARY', ML + sumInner, y + 18, { size: 9, color: sumAccent, weight: 'bold' });
  txt(result.explanation, ML + sumInner, y + 36, { size: 10, color: C.slate700, maxW: sumTextW, lhf: 1.5 });

  y += sumH + 30;

  // ════════════════════════════════════════════════════════════════════════════
  // 3. SECTION 1 – Intercepted Content Analysis
  // ════════════════════════════════════════════════════════════════════════════
  const introLine = inputType === 'url'
    ? 'The malicious artifact consists of the following URL submitted for analysis:'
    : `The malicious artifact consists of the following ${inputType === 'sms' ? 'SMS text string' : 'message content'} transmitted to the target device.`;
  const introH = textH(introLine, CW, 10, 1.4);

  doc.setFont('courier', 'normal');
  doc.setFontSize(9.5);
  const codeLines = doc.splitTextToSize(message || '(no content provided)', CW - 32);
  const codeH     = Math.max(52, codeLines.length * 15 + 28);

  const section1Height = 28 + introH + 12 + codeH + 36; // heading + intro + gap + code + gap
  ensureSpace(section1Height);

  drawSectionHeading(1, 'Intercepted Content Analysis');

  txt(introLine, ML, y, { size: 10, color: C.slate600, maxW: CW });
  y += introH + 12;

  doc.setFont('courier', 'normal');
  doc.setFontSize(9.5);
  doc.setFillColor(...C.codeBg);
  doc.roundedRect(ML, y, CW, codeH, 6, 6, 'F');
  doc.setTextColor(...C.codeText);
  doc.text(codeLines, ML + 16, y + 24, { lineHeightFactor: 1.5 });
  y += codeH + 36;

  // ════════════════════════════════════════════════════════════════════════════
  // 4. SECTION 2 – Technical Threat Indicators & Breakdown (table)
  // ════════════════════════════════════════════════════════════════════════════
  // We'll compute total table height roughly to decide if we need a new page.
  // Table consists of a header row (32pt) plus each indicator row.
  // We'll estimate row height per indicator by measuring one sample, but simpler:
  // We'll just use the existing row‑by‑row check – but ensure the heading + header
  // are on the same page as the first row. We'll force a new page if necessary.

  const HEADING_H       = 28;
  const TABLE_HEADER_H  = 32;
  // Rough minimum for first row: we can just ensure heading + header + some min rows.
  // We'll let the row‑by‑row logic handle the rest, but we ensure the heading and header
  // are placed together. We'll check if we have enough for heading + header + one row minimum.
  const MIN_FIRST_ROW_H = 60;
  const minTableStart   = HEADING_H + TABLE_HEADER_H + MIN_FIRST_ROW_H + 20;
  ensureSpace(minTableStart);

  drawSectionHeading(2, 'Technical Threat Indicators & Breakdown');

  if (!indicators.length) {
    // No indicators
    ensureSpace(44);
    doc.setDrawColor(...C.slate200);
    doc.setFillColor(...C.white);
    doc.roundedRect(ML, y, CW, 36, 4, 4, 'FD');
    txt('No high-confidence technical indicators were extracted from this content.', ML + 12, y + 22, { size: 10, color: C.slate500 });
    y += 52;
  } else {
    // col widths
    const C1W = Math.floor(CW * 0.26);
    const C2W = Math.floor(CW * 0.22);
    const C3W = CW - C1W - C2W;
    const C1X = ML;
    const C2X = ML + C1W;
    const C3X = ML + C1W + C2W;
    const PAD    = 10;
    const C3_PAD = 14;
    const HEADER_H = 32;

    const drawTblHeader = () => {
      doc.setFillColor(...C.ink);
      doc.rect(C1X, y, CW, HEADER_H, 'F');
      txt('Element Analyzed',              C1X + PAD,    y + 20, { size: 9.5, color: C.white, weight: 'bold' });
      txt('Assessment',                    C2X + PAD,    y + 20, { size: 9.5, color: C.white, weight: 'bold' });
      txt('Technical Context & Findings',  C3X + C3_PAD, y + 20, { size: 9.5, color: C.white, weight: 'bold' });
      doc.setDrawColor(...C.slate600);
      doc.setLineWidth(0.5);
      doc.line(C2X, y, C2X, y + HEADER_H);
      doc.line(C3X, y, C3X, y + HEADER_H);
      y += HEADER_H;
    };

    drawTblHeader();

    indicators.forEach((row, idx) => {
      // Compute row height exactly as before
      doc.setFont('helvetica', 'bold');   doc.setFontSize(10);
      const elemLines = doc.splitTextToSize(row.element, C1W - PAD * 2).length;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
      const valLines  = row.value ? doc.splitTextToSize(row.value, C1W - PAD * 2).length : 0;
      doc.setFont('helvetica', 'bold');   doc.setFontSize(9.5);
      const assLines  = doc.splitTextToSize(row.assessment, C2W - PAD * 2).length;

      let findingPts = 0;
      const findingLineH = 13;
      row.findings.forEach((f: string, fi: number) => {
        const ci      = f.indexOf(':');
        const hasBold = ci > 0 && ci < 55;
        const body    = hasBold ? f.slice(ci + 1).trim() : f;

        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        const pfxW = hasBold ? doc.getTextWidth(f.slice(0, ci + 1) + ' ') : 0;
        doc.setFont('helvetica', 'normal');
        const availW  = C3W - C3_PAD * 2 - (hasBold ? pfxW : 0);
        const fLines  = doc.splitTextToSize(body, Math.max(20, availW)).length;
        findingPts   += fLines * findingLineH + (fi === 0 ? 12 : 7);
      });

      const col1Pts = (elemLines + (valLines ? valLines + 0.5 : 0)) * 14;
      const col2Pts = assLines * 14;
      const ROW_H   = Math.max(54, Math.max(col1Pts, col2Pts, findingPts) + 28);

      // Check if this row fits; if not, start new page and re‑draw header
      if (y + ROW_H > BOTTOM) {
        newPage();
        drawTblHeader();
      }

      if (idx % 2 === 1) {
        doc.setFillColor(...C.slate50);
        doc.rect(C1X, y, CW, ROW_H, 'F');
      }

      const cellTop = y + 18;

      // Col 1
      txt(row.element, C1X + PAD, cellTop, { size: 10, color: C.ink, weight: 'bold', maxW: C1W - PAD * 2 });
      if (row.value) {
        const elemPx = elemLines * 10 * 1.4;
        txt(row.value, C1X + PAD, cellTop + elemPx + 2, { size: 9, color: C.slate500, maxW: C1W - PAD * 2, lhf: 1.3 });
      }

      // Col 2
      txt(row.assessment.toUpperCase(), C2X + PAD, cellTop, {
        size: 9.5, color: assessColor(row.assessment), weight: 'bold', maxW: C2W - PAD * 2,
      });

      // Col 3
      const pillColors = assessPillColors(row.assessment);
      let fy = cellTop;

      row.findings.forEach((f: string, fi: number) => {
        const ci      = f.indexOf(':');
        const hasBold = ci > 0 && ci < 55;
        const heading = hasBold ? f.slice(0, ci + 1) : '';
        const body    = hasBold ? f.slice(ci + 1).trim() : f;
        const bullet  = '\u2022  ';

        doc.setFontSize(9.5);

        if (hasBold) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...C.ink);
          const pfxFull = bullet + heading + ' ';
          const pfxW    = doc.getTextWidth(pfxFull);
          doc.text(pfxFull, C3X + C3_PAD, fy);

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...C.slate700);
          const availW    = C3W - C3_PAD * 2 - pfxW;
          const bodyLines = doc.splitTextToSize(body, Math.max(20, availW));
          if (bodyLines.length > 0) {
            doc.text(bodyLines[0], C3X + C3_PAD + pfxW, fy);
            for (let li = 1; li < bodyLines.length; li++) {
              fy += 13;
              doc.text(bodyLines[li], C3X + C3_PAD + 12, fy);
            }
          }
        } else {
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...C.slate700);
          const fullLines = doc.splitTextToSize(bullet + f, C3W - C3_PAD * 2);
          doc.text(fullLines[0], C3X + C3_PAD, fy);
          for (let li = 1; li < fullLines.length; li++) {
            fy += 13;
            doc.text(fullLines[li], C3X + C3_PAD + 12, fy);
          }
        }

        if (fi === 0) {
          fy += 13;
          const pillLabel = row.assessment.toUpperCase();
          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'bold');
          const pillW = doc.getTextWidth(pillLabel) + 8;
          const pillH = 10;
          const pillX = C3X + C3_PAD;
          const pillY = fy - 8;
          doc.setFillColor(...pillColors.bg);
          doc.setDrawColor(...pillColors.border);
          doc.setLineWidth(0.4);
          doc.roundedRect(pillX, pillY, pillW, pillH, 2, 2, 'FD');
          doc.setTextColor(...pillColors.text);
          doc.text(pillLabel, pillX + 4, pillY + 7.5);
          fy += 4;
        }

        fy += 7;
      });

      // Column dividers
      doc.setDrawColor(...C.slate200);
      doc.setLineWidth(0.5);
      doc.line(C2X, y, C2X, y + ROW_H);
      doc.line(C3X, y, C3X, y + ROW_H);
      y += ROW_H;
    });

    hRule(C1X, y, C1X + CW, C.slate300, 0.5);
    y += 32;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 5. SECTION 3 – Operational Recommendations
  // ════════════════════════════════════════════════════════════════════════════
  const safetyTips: SafetyTip[] = Array.isArray(result.safetyTips)
    ? result.safetyTips.map((t: any, i: number) =>
        typeof t === 'string' ? { headline: `Recommendation ${i + 1}`, tip: t } : t)
    : [];

  // Compute total height needed for section heading + all tips
  let totalRecHeight = 28; // heading
  const TIP_INDENT = 16;
  const TIP_W      = CW - TIP_INDENT;
  const LINE_H     = 15;

  safetyTips.forEach((tipItem) => {
    const prefix = tipItem.headline ? `${tipItem.headline}: ` : '';
    const tipText = tipItem.tip || '';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    const pfxW = prefix ? doc.getTextWidth(prefix) : 0;
    doc.setFont('helvetica', 'normal');
    const availW    = Math.max(20, TIP_W - pfxW);
    const firstFit  = doc.splitTextToSize(tipText, availW);
    const firstLine = firstFit[0] || '';
    const restText  = tipText.slice(firstLine.length).trim();
    const restLines = restText ? doc.splitTextToSize(restText, TIP_W) : [];
    const blockH    = (1 + restLines.length) * LINE_H + 12;
    totalRecHeight += blockH;
  });

  ensureSpace(totalRecHeight);

  drawSectionHeading(3, 'Operational Recommendations & Incident Mitigation');

  safetyTips.forEach((tipItem) => {
    const headline = tipItem.headline || '';
    const tipText  = tipItem.tip      || '';
    const prefix   = headline ? `${headline}: ` : '';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    const pfxW = prefix ? doc.getTextWidth(prefix) : 0;
    doc.setFont('helvetica', 'normal');
    const availW    = Math.max(20, TIP_W - pfxW);
    const firstFit  = doc.splitTextToSize(tipText, availW);
    const firstLine = firstFit[0] || '';
    const restText  = tipText.slice(firstLine.length).trim();
    const restLines = restText ? doc.splitTextToSize(restText, TIP_W) : [];
    const blockH    = (1 + restLines.length) * LINE_H + 12;

    // Individual tip space check (redundant but safe)
    ensureSpace(blockH);

    doc.setFillColor(...C.ink);
    doc.circle(ML + 5, y + 4.5, 2, 'F');

    const ly = y + 9;
    if (prefix) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...C.ink);
      doc.text(prefix, ML + TIP_INDENT, ly);
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...C.slate700);
    doc.text(firstLine, ML + TIP_INDENT + pfxW, ly);
    restLines.forEach((line: string, li: number) => {
      doc.text(line, ML + TIP_INDENT, ly + (li + 1) * LINE_H);
    });
    y += blockH;
  });

  // ── Footer (final page) ──
  const fy2 = PH - FOOTER_H + 12;
  hRule(ML, fy2 - 12, PW - MR, C.slate200);
  txt('Custos Security Analysis Report', ML, fy2 + 6, { size: 8, color: C.slate400, align: 'left' });
  txt(`Page ${pageNum}`, PW - MR, fy2 + 6, { size: 8, color: C.slate400, align: 'right' });

  // ── Deliver: blob for preview, or trigger a browser download ──
  if (returnBlob) {
    return doc.output('blob');
  }

  if (save) {
    doc.save(`Custos_Security_Report_${reportId}.pdf`);
  }
}