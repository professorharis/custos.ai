'use client';

import React, { useState } from 'react';
import { Bug, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { SimpleModal } from './SimpleModal';

interface BugReportModalProps {
  open: boolean;
  onClose: () => void;
}

function SeverityPicker({ value, onChange }: { value: 'low' | 'medium' | 'high'; onChange: (v: 'low' | 'medium' | 'high') => void }) {
  const options: { value: 'low' | 'medium' | 'high'; label: string }[] = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
  ];
  return (
    <div className="inline-flex items-center bg-stone-100 rounded-lg p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 rounded-md text-[12.5px] font-semibold transition-colors ${
            value === opt.value ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function BugReportModal({ open, onClose }: BugReportModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high'>('medium');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const submit = async () => {
    if (!title.trim() || !description.trim()) return;
    setStatus('sending');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('bug_reports').insert({
        user_id: user?.id ?? null,
        title: title.trim(),
        description: description.trim(),
        severity,
        page_url: typeof window !== 'undefined' ? window.location.href : null,
      });
      if (error) throw error;
      setStatus('sent');
      setTitle('');
      setDescription('');
      setTimeout(() => {
        setStatus('idle');
        onClose();
      }, 1400);
    } catch (err) {
      console.error('Bug report failed:', err);
      setStatus('error');
    }
  };

  return (
    <SimpleModal open={open} onClose={onClose} title="Report a Bug" subtitle="Found something broken? Let us know" icon={Bug}>
      <div className="space-y-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Short summary (e.g. Scan button unresponsive)"
          autoFocus
          className="w-full text-[13.5px] px-3.5 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-blue-300 bg-white"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Steps to reproduce, what you expected, what happened instead…"
          rows={5}
          className="w-full text-[13.5px] px-3.5 py-3 rounded-xl border border-stone-200 outline-none focus:border-blue-300 bg-white resize-none"
        />
        <div className="flex items-center justify-between">
          <SeverityPicker value={severity} onChange={setSeverity} />
          <button
            onClick={submit}
            disabled={status === 'sending' || !title.trim() || !description.trim()}
            className="px-4 py-2 rounded-lg text-[12.5px] font-semibold bg-stone-800 text-white hover:bg-stone-900 disabled:opacity-40 flex items-center gap-1.5"
          >
            {status === 'sending' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bug className="w-3.5 h-3.5" />}
            Submit
          </button>
        </div>
        {status === 'sent' && <p className="text-[11.5px] text-green-600">Thanks — bug report received.</p>}
        {status === 'error' && <p className="text-[11.5px] text-red-600">Something went wrong, try again.</p>}
      </div>
    </SimpleModal>
  );
}

export default BugReportModal;