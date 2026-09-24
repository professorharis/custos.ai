'use client';

import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { SimpleModal } from './SimpleModal';

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
}

export function FeedbackModal({ open, onClose }: FeedbackModalProps) {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const submit = async () => {
    if (!message.trim()) return;
    setStatus('sending');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('feedback').insert({
        user_id: user?.id ?? null,
        message: message.trim(),
      });
      if (error) throw error;
      setStatus('sent');
      setMessage('');
      setTimeout(() => {
        setStatus('idle');
        onClose();
      }, 1400);
    } catch (err) {
      console.error('Feedback submit failed:', err);
      setStatus('error');
    }
  };

  return (
    <SimpleModal open={open} onClose={onClose} title="Send Feedback" subtitle="Tell us what's working, and what isn't" icon={Send}>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="I'd love it if Custos AI could…"
        rows={6}
        autoFocus
        className="w-full text-[13.5px] px-3.5 py-3 rounded-xl border border-stone-200 outline-none focus:border-blue-300 bg-white resize-none"
      />
      <div className="flex items-center justify-between mt-3">
        <span className="text-[11.5px] text-stone-400">
          {status === 'sent' && 'Thanks — feedback sent!'}
          {status === 'error' && 'Something went wrong, try again.'}
        </span>
        <button
          onClick={submit}
          disabled={status === 'sending' || !message.trim()}
          className="px-4 py-2 rounded-lg text-[12.5px] font-semibold bg-stone-800 text-white hover:bg-stone-900 disabled:opacity-40 flex items-center gap-1.5"
        >
          {status === 'sending' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          Send
        </button>
      </div>
    </SimpleModal>
  );
}

export default FeedbackModal;