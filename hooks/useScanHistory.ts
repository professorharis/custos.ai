'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// ─────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────

export interface ScanRow {
  id: string;
  type: 'Text' | 'Email' | 'URL';
  content: string;
  risk_level: 'Low' | 'Medium' | 'High';
  risk_score: number;
  is_scam: boolean;
  details: any;
  title: string | null;
  pinned: boolean;
  created_at: string;
}

export interface HistoryEntry {
  id: string;
  label: string;
  timestamp: string;
  pinned: boolean;
  raw: ScanRow;
}

export interface UsageSummary {
  scansToday: number;
  scansThisMonth: number;
  scansTotal: number;
}

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function toEntry(row: ScanRow): HistoryEntry {
  const fallback = (row.content ?? '').slice(0, 34) + (row.content?.length > 34 ? '…' : '');
  return {
    id: row.id,
    label: row.title?.trim() ? row.title : fallback,
    timestamp: timeAgo(row.created_at),
    pinned: !!row.pinned,
    raw: row,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Hook — replaces the old rawHistory/pinnedHistoryIds/deletedHistoryIds/
// historyOverrides local-state combo in Scanner.tsx with real Supabase
// reads + writes against the `scans` table (see scans_table.sql).
// ─────────────────────────────────────────────────────────────────────────

export function useScanHistory(limit = 8) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setHistory([]);
        setUsage(null);
        return;
      }

      const { data, error } = await supabase
        .from('scans')
        .select('id, type, content, risk_level, risk_score, is_scam, details, title, pinned, created_at')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!error && data) {
        setHistory(data.map((row) => toEntry(row as ScanRow)));
      }

      const { data: usageRow } = await supabase
        .from('scan_usage_summary')
        .select('scans_today, scans_this_month, scans_total')
        .eq('user_id', user.id)
        .maybeSingle();

      setUsage({
        scansToday: usageRow?.scans_today ?? 0,
        scansThisMonth: usageRow?.scans_this_month ?? 0,
        scansTotal: usageRow?.scans_total ?? 0,
      });
    } catch (err) {
      console.error('Failed to load scan history:', err);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // ── mutations, all persisted straight to Supabase ──

  const pinToggle = useCallback(async (id: string) => {
    const current = history.find((h) => h.id === id);
    if (!current) return;
    const nextPinned = !current.pinned;
    // optimistic update
    setHistory((prev) => prev.map((h) => (h.id === id ? { ...h, pinned: nextPinned } : h)));
    const { error } = await supabase.from('scans').update({ pinned: nextPinned }).eq('id', id);
    if (error) {
      console.error('Pin toggle failed:', error);
      refresh();
    }
  }, [history, refresh]);

  const rename = useCallback(async (id: string, label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    setHistory((prev) => prev.map((h) => (h.id === id ? { ...h, label: trimmed } : h)));
    const { error } = await supabase.from('scans').update({ title: trimmed }).eq('id', id);
    if (error) {
      console.error('Rename failed:', error);
      refresh();
    }
  }, [refresh]);

  const softDelete = useCallback(async (id: string) => {
    setHistory((prev) => prev.filter((h) => h.id !== id));
    const { error } = await supabase
      .from('scans')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      console.error('Delete failed:', error);
      refresh();
    }
  }, [refresh]);

  return { history, usage, loading, refresh, pinToggle, rename, softDelete };
}