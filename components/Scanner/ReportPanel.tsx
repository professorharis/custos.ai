'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  ArrowUp,
  Check,
  Copy,
  Download,
  FileText,
  Menu,
  Minimize2,
  Share2,
  X,
} from 'lucide-react';
import { getRiskLevelLabel } from '@/lib/scannerHelpers';
import { ReportDocument } from '@/components/ReportDocument';
import { DocumentView } from '@/components/DocumentView';
import type { ScamResultWithFindings } from './types';

export interface ReportPanelProps {
  open: boolean;
  fullScreen: boolean;
  mode: 'document' | 'presentation';
  result: ScamResultWithFindings | null;
  inputContent: string;
  inputType: string;
  onClose: () => void;
  onToggleFullScreen: () => void;
  onDownload: () => void;
  isMobile: boolean;
  onOpenMobileMenu: () => void;
}

export function ReportPanel({
  open,
  fullScreen,
  mode,
  result,
  inputContent,
  inputType,
  onClose,
  onToggleFullScreen,
  onDownload,
  isMobile,
  onOpenMobileMenu,
}: ReportPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!result) return;
    const summary = [
      `Custos AI Security Report`,
      `Scan ID: ${result.scanId ?? ''}`,
      `Risk Score: ${result.riskScore}/100 (${getRiskLevelLabel(result.riskLevel)})`,
      '',
      result.explanation,
    ].join('\n');
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  }, [result]);

  const handleShare = useCallback(async () => {
    if (!result) return;
    const shareText = `Custos AI scan — Risk Score: ${result.riskScore}/100 (${getRiskLevelLabel(result.riskLevel)})`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Custos AI Security Report', text: shareText });
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(shareText);
    }
  }, [result]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (fullScreen) onToggleFullScreen();
        else onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, fullScreen, onClose, onToggleFullScreen]);

  const panelTitle = mode === 'presentation' ? 'Presentation Report' : 'Document Report';
  const effectiveFullScreen = fullScreen || isMobile;

  return (
    <div
      className={`flex-shrink-0 bg-white overflow-hidden transition-opacity duration-150 ease-out ${
        !open
          ? 'w-0 opacity-0'
          : effectiveFullScreen
          ? `${isMobile ? 'fixed inset-0 z-40' : 'flex-1 min-w-0'} opacity-100`
          : 'w-full md:w-[50vw] border-l border-[#e7e4e1] opacity-100'
      }`}
    >
      <div className="w-full h-full flex flex-col">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 sm:px-5 py-3 bg-white border-b border-[#e7e4e1]">
          <div className="flex items-center gap-2 min-w-0">
            {isMobile && (
              <button
                onClick={onOpenMobileMenu}
                title="Open menu"
                className="p-1.5 -ml-1.5 rounded-lg text-stone-600 hover:bg-stone-100 transition-colors flex-shrink-0"
              >
                <Menu className="w-[18px] h-[18px]" />
              </button>
            )}
            <FileText className="w-4 h-4 text-stone-500 flex-shrink-0" />
            <span className="text-sm font-semibold text-stone-700 truncate">{panelTitle}</span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={onDownload}
              title="Download PDF"
              className="p-2 rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-800 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handleCopy}
              title="Copy"
              className="p-2 rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-800 transition-colors relative"
            >
              {copied ? (
                <Check className="w-4 h-4 text-stone-900" strokeWidth={2.5} />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={handleShare}
              title="Share"
              className="p-2 rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-800 transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>
            {!isMobile && (
              <button
                onClick={onToggleFullScreen}
                title={fullScreen ? 'Exit full screen' : 'Full screen'}
                className="p-2 rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-800 transition-colors"
              >
                {fullScreen ? <Minimize2 className="w-4 h-4" /> : <ArrowUp className="w-4 h-4 rotate-45" />}
              </button>
            )}
            <div className="w-px h-5 bg-stone-200 mx-1" />
            <button
              onClick={onClose}
              title="Close"
              className="p-2 rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 scyra-scroll">
          {result && (
            mode === 'document' ? (
              <DocumentView result={result} inputContent={inputContent} inputType={inputType} />
            ) : (
              <ReportDocument
                result={result}
                inputContent={inputContent}
                inputType={inputType}
                hideDownload
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default ReportPanel;