/**
 * generatePdfDocument.ts
 * ─────────────────────────────────────────────────────────────────────────
 * Captures the ACTUAL rendered DOM node (e.g. the <DocumentView /> that's
 * already showing in the panel) as an image and slices it across A4 pages.
 * The result matches the on-screen layout, fonts, colors and data exactly,
 * because it IS the on-screen layout — as opposed to `generatePdfReport.ts`,
 * which manually re-draws a report from scratch with jsPDF primitives.
 *
 * Use this for the "Document Report" / <DocumentView /> panel.
 * Use `generatePdfReport.ts` for the "Presentation Report" / <ReportDocument />
 * panel AND for the standalone ReportViewerModal preview — both of those
 * should stay on the jsPDF-drawn version so they match each other exactly.
 *
 * IMPORTANT: uses `html2canvas-pro` (NOT the plain `html2canvas` package).
 * Modern Tailwind/CSS emits colors via lab()/oklch()/color-mix(), which the
 * original html2canvas cannot parse ("Attempting to parse an unsupported
 * color function") and throws on. html2canvas-pro is a drop-in fork that
 * adds support for these modern color functions.
 *
 * Requires:
 *   npm install html2canvas-pro
 *   (remove `html2canvas` if it was installed for this purpose — no longer used)
 * ─────────────────────────────────────────────────────────────────────────
 */

export interface GeneratePdfFromElementOptions {
  /** File name WITHOUT extension, e.g. "Custos_Security_Report_SCY-2026-6769" */
  fileName: string;
  /** If true, returns a Blob instead of triggering a browser download. */
  returnBlob?: boolean;
  /** Background color behind the captured content (defaults to white). */
  backgroundColor?: string;
  /** Extra scale factor for sharper output (defaults to 2 for retina-quality). */
  scale?: number;
}

const A4_WIDTH_PT = 595.28;  // A4 width in points (jsPDF 'pt' unit)
const A4_HEIGHT_PT = 841.89; // A4 height in points

/**
 * Captures `element` (the live, rendered DOM node) and produces a PDF that
 * looks exactly like what's on screen, paginated to fit A4 sheets.
 */
export async function generatePDFFromElement(
  element: HTMLElement,
  options: GeneratePdfFromElementOptions
): Promise<Blob | void> {
  const {
    fileName,
    returnBlob = false,
    backgroundColor = '#ffffff',
    scale = 2,
  } = options;

  // NOTE: html2canvas-pro's default export works the same way as
  // html2canvas's — it's a drop-in replacement, just with modern CSS
  // color-function support (lab, oklch, color-mix, etc).
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas-pro'),
    import('jspdf'),
  ]);

  // Render the live DOM node to a canvas at high resolution so text stays
  // crisp in the resulting PDF (scale: 2 ≈ retina quality; bump higher for
  // very fine print, at the cost of file size / render time).
  const canvas = await html2canvas(element, {
    scale,
    backgroundColor,
    useCORS: true,
    logging: false,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  });

  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });

  // Scale the captured canvas to fit the PDF's page width, then slice the
  // tall image into successive A4-height chunks — one addImage() call per
  // page — so multi-page reports paginate cleanly instead of being
  // squashed onto a single sheet.
  const pageWidth = A4_WIDTH_PT;
  const pageHeight = A4_HEIGHT_PT;

  const imgWidthPt = pageWidth;
  const pxPerPt = canvas.width / imgWidthPt;
  const pageHeightPx = Math.floor(pageHeight * pxPerPt);

  let renderedHeightPx = 0;
  let pageIndex = 0;

  while (renderedHeightPx < canvas.height) {
    const sliceHeightPx = Math.min(pageHeightPx, canvas.height - renderedHeightPx);

    // Draw this vertical slice of the big canvas onto its own small canvas
    // so each addImage() call only carries one page's worth of pixels.
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    pageCanvas.height = sliceHeightPx;
    const ctx = pageCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      ctx.drawImage(
        canvas,
        0, renderedHeightPx, canvas.width, sliceHeightPx,
        0, 0, canvas.width, sliceHeightPx
      );
    }

    const sliceImgData = pageCanvas.toDataURL('image/jpeg', 0.95);
    const sliceHeightPt = sliceHeightPx / pxPerPt;

    if (pageIndex > 0) doc.addPage();
    doc.addImage(sliceImgData, 'JPEG', 0, 0, imgWidthPt, sliceHeightPt);

    renderedHeightPx += sliceHeightPx;
    pageIndex += 1;
  }

  if (returnBlob) {
    return doc.output('blob');
  }

  doc.save(`${fileName}.pdf`);
}