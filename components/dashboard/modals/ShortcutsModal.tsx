'use client';

import React from 'react';
import { Keyboard } from 'lucide-react';
import { SimpleModal } from './SimpleModal';

interface ShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

const SHORTCUTS: { keys: string[]; label: string }[] = [
  { keys: ['Enter'], label: 'Run scan' },
  { keys: ['Shift', 'Enter'], label: 'New line in input' },
  { keys: ['Esc'], label: 'Close report panel / this window' },
  { keys: ['⌘', 'K'], label: 'Focus the input box' },
  { keys: ['⌘', 'N'], label: 'Start a new scan' },
  { keys: ['⌘', 'B'], label: 'Toggle sidebar' },
];

export function ShortcutsModal({ open, onClose }: ShortcutsModalProps) {
  return (
    <SimpleModal open={open} onClose={onClose} title="Keyboard Shortcuts" subtitle="Move around Custos AI faster" icon={Keyboard}>
      <div className="border border-stone-150 rounded-xl overflow-hidden">
        {SHORTCUTS.map((s, i) => (
          <div
            key={s.label}
            className={`flex items-center justify-between px-4 py-3 ${i !== SHORTCUTS.length - 1 ? 'border-b border-stone-100' : ''}`}
          >
            <span className="text-[13px] text-stone-700">{s.label}</span>
            <div className="flex items-center gap-1">
              {s.keys.map((k) => (
                <kbd
                  key={k}
                  className="text-[11.5px] font-semibold px-2 py-1 rounded-md bg-stone-100 text-stone-600 border border-stone-200"
                >
                  {k}
                </kbd>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SimpleModal>
  );
}

export default ShortcutsModal;