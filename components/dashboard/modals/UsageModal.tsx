'use client';

import React from 'react';
import { BarChart3, FileText, Mail, Globe } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useScanHistory } from '@/hooks/useScanHistory';
import { SimpleModal } from './SimpleModal';

interface UsageModalProps {
  open: boolean;
  onClose: () => void;
}

const TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  Text: FileText,
  Email: Mail,
  URL: Globe,
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-stone-100 last:border-b-0">
      <span className="text-[13px] text-stone-500">{label}</span>
      <span className="text-[13.5px] font-semibold text-stone-800">{value}</span>
    </div>
  );
}

export function UsageModal({ open, onClose }: UsageModalProps) {
  const { profile } = useProfile();
  const { usage, history, loading } = useScanHistory(5);
  const isPro = profile?.plan === 'Pro';
  const dailyLimit = 10;
  const today = usage?.scansToday ?? 0;
  const creditsRemaining = isPro ? '∞' : Math.max(dailyLimit - today, 0);

  return (
    <SimpleModal open={open} onClose={onClose} title="Usage" subtitle="Your scan activity" icon={BarChart3}>
      <div className="mb-5">
        <Row label="Current Plan" value={profile?.plan ?? 'Free'} />
        <Row label="Today's Usage" value={loading ? '…' : `${today} / ${dailyLimit} scans`} />
        <Row label="Monthly Usage" value={loading ? '…' : `${usage?.scansThisMonth ?? 0} scans`} />
        <Row label="Credits Remaining" value={loading ? '…' : creditsRemaining} />
        <Row label="Storage" value={loading ? '…' : `${usage?.scansTotal ?? 0} Reports`} />
      </div>

      {!isPro && (
        <div className="mb-5">
          <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all"
              style={{ width: `${Math.min((today / dailyLimit) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      <div>
        <h3 className="text-[12px] font-semibold uppercase tracking-wide text-stone-400 mb-2">Recent Activity</h3>
        {history.length === 0 ? (
          <p className="text-[12.5px] text-stone-400">No scans yet.</p>
        ) : (
          <div className="space-y-1">
            {history.map((h) => {
              const Icon = TYPE_ICON[h.raw.type] ?? FileText;
              const riskColor =
                h.raw.risk_level === 'High' ? 'text-red-600 bg-red-50' :
                h.raw.risk_level === 'Medium' ? 'text-amber-600 bg-amber-50' :
                'text-green-600 bg-green-50';
              return (
                <div key={h.id} className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-stone-50">
                  <Icon className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                  <span className="flex-1 min-w-0 text-[12.5px] text-stone-700 truncate">{h.label}</span>
                  <span className={`text-[10.5px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${riskColor}`}>
                    {h.raw.risk_level}
                  </span>
                  <span className="text-[11px] text-stone-400 flex-shrink-0">{h.timestamp}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SimpleModal>
  );
}

export default UsageModal;