// lib/generateA4Pdf.ts
//
// Captures whatever is rendered in the report panel (DocumentView OR
// ReportDocument) and turns it into a multi-page A4 PDF, WPS / Word style:
//   • fixed A4 page (210 × 297 mm), top/bottom margins on EVERY page
//   • content is paginated, and page breaks avoid cutting through headings,
//     list items, table rows and text lines
//   • "Page X of Y" footer
//   • what you see in the panel = what you get in the PDF
//
// Requires:  npm i jspdf html2canvas-pro

export interface A4PdfOptions {
  /** File name, with or without ".pdf" */
  fileName: string;
  /** Extra horizontal padding (px, at 794px page width) added around the content.
   *  DocumentView already has its own side padding → use 0.
   *  ReportDocument has almost none → use ~48. */
  paddingX?: number;
  marginTopMm?: number;
  marginBottomMm?: number;
  showPageNumbers?: boolean;
  footerLabel?: string;
}

const A4_W_MM = 210;
const A4_H_MM = 297;
const A4_W_PX = 794; // A4 width at 96 dpi
const PX_PER_MM = A4_W_PX / A4_W_MM;

// Width the cloned DOM is laid out at, so Tailwind `sm:` / `md:` rules resolve
// to the DESKTOP layout even when the user downloads from a phone.
const RENDER_WINDOW_WIDTH = 1280;

const ATOMIC_SELECTOR = 'li, p, tr, h1, h2, h3, h4, pre, .whitespace-pre-wrap, [data-pdf-keep]';
const HEADING_SELECTOR = 'h1, h2, h3, h4';
const LINE_SNAP_SELECTOR = 'p, li, pre, .whitespace-pre-wrap';

const HEADING_KEEP_WITH_NEXT_PX = 56; // heading never ends a page alone
const MAX_ATOMIC_PX = 220; // taller paragraphs may split (at line boundaries)
const MAX_ATOMIC_ROW_PX = 360; // taller table rows may split (between findings)
const MIN_FILL_PX = 48; // don't leave a page almost empty just to avoid a split

interface Block {
  top: number;
  bottom: number;
  atomic: boolean;
  lineHeight?: number;
  contentTop?: number;
}

function parsePx(v: string): number {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

function measureBlocks(root: HTMLElement): { blocks: Block[]; totalHeight: number } {
  const rootTop = root.getBoundingClientRect().top;
  const blocks: Block[] = [];

  root.querySelectorAll<HTMLElement>(ATOMIC_SELECTOR).forEach((el) => {
    const r = el.getBoundingClientRect();
    const height = r.height;
    if (height <= 0) return;

    const top = r.top - rootTop;
    let bottom = r.bottom - rootTop;
    const isHeading = el.matches(HEADING_SELECTOR);
    const isRow = el.tagName === 'TR';
    const canSnapLines = el.matches(LINE_SNAP_SELECTOR);

    if (isHeading) bottom += HEADING_KEEP_WITH_NEXT_PX;

    const atomic = isHeading
      ? true
      : isRow
      ? height <= MAX_ATOMIC_ROW_PX
      : height <= MAX_ATOMIC_PX;

    const block: Block = { top, bottom, atomic };

    if (!atomic && canSnapLines) {
      const cs = getComputedStyle(el);
      const fontSize = parsePx(cs.fontSize) || 14;
      const lh = cs.lineHeight === 'normal' ? fontSize * 1.2 : parsePx(cs.lineHeight) || fontSize * 1.5;
      block.lineHeight = lh;
      block.contentTop = top + parsePx(cs.paddingTop) + parsePx(cs.borderTopWidth);
    }

    blocks.push(block);
  });

  return { blocks, totalHeight: root.scrollHeight };
}

/** Moves a proposed page break upward so it doesn't cut through a block. */
function adjustBreak(target: number, start: number, pageH: number, blocks: Block[]): number {
  let cur = target;

  for (let i = 0; i < 60; i++) {
    let moved = false;

    const hits = blocks
      .filter((b) => b.top + 0.5 < cur && cur < b.bottom - 0.5)
      .sort((a, b) => b.bottom - b.top - (a.bottom - a.top));

    for (const b of hits) {
      if (b.atomic) {
        if (b.top > start + MIN_FILL_PX && b.bottom - b.top <= pageH) {
          cur = b.top;
          moved = true;
          break;
        }
      } else if (b.lineHeight && b.contentTop !== undefined) {
        const lines = Math.floor((cur - b.contentTop) / b.lineHeight);
        const snapped = b.contentTop + lines * b.lineHeight;
        if (snapped > start + MIN_FILL_PX && snapped < cur - 0.5) {
          cur = snapped;
          moved = true;
          break;
        }
      }
    }

    if (!moved) break;
  }

  return cur;
}

function computePages(totalHeight: number, pageH: number, blocks: Block[]): Array<[number, number]> {
  const pages: Array<[number, number]> = [];
  let start = 0;

  while (start < totalHeight - 1) {
    const target = start + pageH;
    let end: number;

    if (target >= totalHeight) {
      end = totalHeight;
    } else {
      end = adjustBreak(target, start, pageH, blocks);
      if (end <= start + 1) end = target; // safety: hard cut
    }

    pages.push([start, end]);
    start = end;
  }

  return pages.length ? pages : [[0, totalHeight]];
}

export async function generateA4Pdf(source: HTMLElement, options: A4PdfOptions): Promise<void> {
  const {
    fileName,
    paddingX = 0,
    marginTopMm = 14,
    marginBottomMm = 16,
    showPageNumbers = true,
    footerLabel = 'Custos AI',
  } = options;

  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas-pro'),
    import('jspdf'),
  ]);

  // 1. Put a clean A4-width copy of the panel content off-screen
  const host = document.createElement('div');
  host.setAttribute('data-pdf-root', '1');
  host.style.cssText = [
    'position:fixed',
    'left:-10000px',
    'top:0',
    `width:${A4_W_PX}px`,
    'box-sizing:border-box',
    `padding:0 ${paddingX}px`,
    'background:#ffffff',
    'color:#000',
    'pointer-events:none',
  ].join(';');

  const clone = source.cloneNode(true) as HTMLElement;
  host.appendChild(clone);

  // Outer vertical padding is replaced by the per-page margins
  const innerRoot = (clone.firstElementChild as HTMLElement | null) ?? clone;
  innerRoot.style.paddingTop = '0px';
  innerRoot.style.paddingBottom = '0px';

  document.body.appendChild(host);

  try {
    if ((document as any).fonts?.ready) await (document as any).fonts.ready;

    // Keep canvas size within browser limits (important on phones)
    const liveHeight = Math.max(host.offsetHeight, 1);
    const scale = Math.max(1, Math.min(2, Math.sqrt(14_000_000 / (A4_W_PX * liveHeight))));

    let blocks: Block[] = [];
    let totalHeight = 0;

    const canvas = await html2canvas(host, {
      scale,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      windowWidth: RENDER_WINDOW_WIDTH,
      onclone: (clonedDoc: Document) => {
        const root = clonedDoc.querySelector<HTMLElement>('[data-pdf-root="1"]');
        if (!root) return;
        root.style.position = 'absolute';
        root.style.left = '0px';
        root.style.top = '0px';
        // Measure in the SAME layout that gets rendered
        const m = measureBlocks(root);
        blocks = m.blocks;
        totalHeight = m.totalHeight;
      },
    });

    if (!canvas.width || !canvas.height) throw new Error('PDF capture produced an empty canvas');
    if (!totalHeight) totalHeight = canvas.height / scale;

    // 2. Decide page breaks (in CSS px)
    const contentHeightMm = A4_H_MM - marginTopMm - marginBottomMm;
    const pageH = contentHeightMm * PX_PER_MM;
    const pages = computePages(totalHeight, pageH, blocks);

    // 3. Build the PDF
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });

    pages.forEach(([startPx, endPx], idx) => {
      if (idx > 0) pdf.addPage('a4', 'portrait');

      const srcY = Math.round(startPx * scale);
      const srcH = Math.max(1, Math.min(canvas.height - srcY, Math.round((endPx - startPx) * scale)));

      const slice = document.createElement('canvas');
      slice.width = canvas.width;
      slice.height = srcH;
      const ctx = slice.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context unavailable');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, slice.width, slice.height);
      ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);

      const img = slice.toDataURL('image/jpeg', 0.93);
      const sliceHeightMm = srcH / scale / PX_PER_MM;
      pdf.addImage(img, 'JPEG', 0, marginTopMm, A4_W_MM, sliceHeightMm, undefined, 'FAST');

      if (showPageNumbers) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(128, 128, 128);
        pdf.text(`${footerLabel}  |  Page ${idx + 1} of ${pages.length}`, A4_W_MM / 2, A4_H_MM - 8, {
          align: 'center',
        });
      }
    });

    pdf.save(fileName.toLowerCase().endsWith('.pdf') ? fileName : `${fileName}.pdf`);
  } finally {
    host.remove();
  }
}

export default generateA4Pdf;