'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, Printer, Download, Loader2, Share2 } from 'lucide-react';
import { generatePDFReport } from '@/lib/generatePdfReport';
import type { ScamResult, ThreatIndicator } from '@/lib/types';

interface ReportViewerModalProps {
  open: boolean;
  result: ScamResult | null;
  inputContent: string;
  inputType: string;
  onClose: () => void;
  /** Pre‑built report data (optional) */
  savedData?: {
    reportId: string;
    cvss: string;
    campaignStatus: string;
    threatTypeLabel: string;
    targetBrand: string;
    indicators: ThreatIndicator[];
    formattedDate: string;
  };
}

const ZOOM_MIN  = 40;
const ZOOM_MAX  = 130;
const ZOOM_STEP = 10;

// A4 size in points (used for scaling only)
const A4_W = 794;
const A4_H = 1123;

export function ReportViewerModal({
  open,
  result,
  inputContent,
  inputType,
  onClose,
  savedData,
}: ReportViewerModalProps) {
  const [zoom, setZoom] = useState(100);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Generate PDF when modal opens
  useEffect(() => {
    if (!open || !result) return;
    let cancelled = false;

    const generate = async () => {
      setLoading(true);
      try {
        const data = savedData ?? {
          reportId: 'unknown',
          cvss: '',
          campaignStatus: '',
          threatTypeLabel: '',
          targetBrand: '',
          indicators: [],
          formattedDate: new Date().toLocaleDateString('en-US', {
            month: 'long', day: 'numeric', year: 'numeric',
          }),
        };

        const blob = await generatePDFReport(
          result,
          inputType,
          inputContent,
          data.formattedDate,
          data.indicators,
          data.reportId,
          data.cvss,
          data.campaignStatus,
          data.threatTypeLabel,
          data.targetBrand,
          { returnBlob: true, save: false }
        );

        if (!cancelled && blob) {
          const url = URL.createObjectURL(blob);
          setPdfBlobUrl(url);
        }
      } catch (err) {
        console.error('Failed to generate PDF for preview:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    generate();

    return () => {
      cancelled = true;
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
        setPdfBlobUrl(null);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, result]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open || !result) return null;

  const data = savedData ?? {
    reportId: 'unknown',
    cvss: '',
    campaignStatus: '',
    threatTypeLabel: '',
    targetBrand: '',
    indicators: [],
    formattedDate: new Date().toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    }),
  };

  const fileName = `Scyra_Security_Report_${data.reportId}.pdf`;

  const handleZoomIn  = () => setZoom(z => Math.min(ZOOM_MAX, z + ZOOM_STEP));
  const handleZoomOut = () => setZoom(z => Math.max(ZOOM_MIN, z - ZOOM_STEP));
  const handleZoomReset = () => setZoom(100);

  const handlePrint = () => {
    iframeRef.current?.contentWindow?.print();
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await generatePDFReport(
        result,
        inputType,
        inputContent,
        data.formattedDate,
        data.indicators,
        data.reportId,
        data.cvss,
        data.campaignStatus,
        data.threatTypeLabel,
        data.targetBrand,
        { save: true, returnBlob: false }
      );
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Unable to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    const text = `Scyra Security Report ${data.reportId}\nThreat: ${data.threatTypeLabel}\nStatus: ${data.campaignStatus}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Scyra AI Security Report', text, url: window.location.href }); }
      catch (_) { /* cancelled */ }
    } else {
      navigator.clipboard.writeText(text);
      alert('Report details copied to clipboard!');
    }
  };

  // Auto‑fit scale (only once, based on initial viewport)
  const autoFitScale = typeof window !== 'undefined'
    ? Math.min(1, (window.innerWidth - 32) / A4_W)
    : 1;
  const scale = autoFitScale * (zoom / 100);

  return (
    <div className="fixed inset-0 z-50 flex flex-col print:static print:block">
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #scyra-print-area, #scyra-print-area * { visibility: visible; }
          #scyra-print-area { position: absolute; inset: 0; transform: none !important; width: 100% !important; }
        }
      `}</style>

      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm print:hidden" onClick={onClose} />

      {/* Top toolbar: close, filename, share, print, download */}
      <div className="relative z-10 flex items-center justify-between gap-2 px-3 sm:px-5 py-2.5 bg-[#1e1e20] text-slate-200 flex-shrink-0 print:hidden">
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0" aria-label="Close">
            <X className="w-[18px] h-[18px]" />
          </button>
          <span className="text-xs text-slate-400 truncate max-w-[120px] sm:max-w-[280px]">{fileName}</span>
        </div>

        <div className="flex items-center gap-0.5">
          <button onClick={handleShare} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <Share2 className="w-[17px] h-[17px]" />
          </button>
          <button onClick={handlePrint} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <Printer className="w-[17px] h-[17px]" />
          </button>
          <button onClick={handleDownload} disabled={downloading} className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50">
            {downloading ? <Loader2 className="w-[17px] h-[17px] animate-spin" /> : <Download className="w-[17px] h-[17px]" />}
          </button>
        </div>
      </div>

      {/* PDF viewer area */}
      <div className="relative z-10 flex-1 overflow-auto bg-[#404040] py-8 print:hidden">
        <div id="scyra-print-area" className="hidden print:block">
          {/* We don't have a React fallback for print; we rely on the iframe's print */}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          </div>
        ) : pdfBlobUrl ? (
         <div className="flex justify-center">
            <div
              style={{
                width: A4_W * scale,
                height: A4_H * scale,
              }}
              // 1. bg-white add kiya taake piche ka dark area nazar na aye
              className="relative shadow-2xl overflow-hidden rounded-md bg-white"
            >
              <iframe
                ref={iframeRef}
                // 2. view=Fit ki jagah view=FitH (Fit Horizontal) kar diya. 
                // Yeh PDF ko width ke hisaab se stretch karega aur scrollbar ko khatam karega.
                src={`${pdfBlobUrl}#toolbar=0&navpanes=0&scrollbar=0&statusbar=0&messages=0&view=FitH`}
                // 3. block aur overflow-hidden CSS add ki
                className="w-full h-full border-0 pointer-events-none block"
                style={{ overflow: 'hidden' }}
                // 4. HTML5 scrolling attribute ko disable kar diya
                scrolling="no"
                title="PDF Preview"
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-white">
            Failed to load PDF
          </div>
        )}
      </div>

      {/* Bottom bar: page counter (static) + zoom controls */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 print:hidden">
        <div className="flex items-center gap-4 px-5 py-2.5 bg-black/60 backdrop-blur-sm rounded-full text-white text-sm font-medium select-none">
          <span className="tabular-nums whitespace-nowrap">
            Pages 1 / 1
          </span>
          <div className="w-px h-5 bg-white/20" />
          <button
            onClick={handleZoomOut}
            disabled={zoom <= ZOOM_MIN}
            className="p-1 rounded-full hover:bg-white/10 disabled:opacity-40 transition-colors"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomReset}
            className="min-w-[2.5rem] text-center text-sm font-bold hover:bg-white/10 rounded-full px-1.5 py-0.5 transition-colors"
            aria-label="Reset zoom"
          >
            {zoom}%
          </button>
          <button
            onClick={handleZoomIn}
            disabled={zoom >= ZOOM_MAX}
            className="p-1 rounded-full hover:bg-white/10 disabled:opacity-40 transition-colors"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}