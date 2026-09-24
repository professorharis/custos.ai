'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const FONT_BODY = "'Inter', ui-sans-serif, system-ui, sans-serif";

interface SimpleModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  maxWidth?: string; // tailwind max-w-* class
  children: React.ReactNode;
}

export function SimpleModal({
  open,
  onClose,
  title,
  subtitle,
  icon: Icon,
  maxWidth = 'max-w-md',
  children,
}: SimpleModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ fontFamily: FONT_BODY }}>
      <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-[2px]" onClick={onClose} />

      <div className={`relative w-full ${maxWidth} max-h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col`}>
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-stone-100 flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {Icon && (
              <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-stone-600" />
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold text-stone-800 truncate">{title}</h2>
              {subtitle && <p className="text-[12px] text-stone-400 truncate">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            title="Close"
            className="p-1.5 rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 scyra-scroll">{children}</div>
      </div>
    </div>
  );
}

export default SimpleModal;