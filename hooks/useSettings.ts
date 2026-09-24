'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface Settings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  default_report_view: 'document' | 'presentation';
  notifications_enabled: boolean;
  product_updates_enabled: boolean;
  two_factor_enabled: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  language: 'en',
  default_report_view: 'document',
  notifications_enabled: true,
  product_updates_enabled: true,
  two_factor_enabled: false,
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userIdRef = useRef<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setError(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSettings(DEFAULT_SETTINGS);
      setLoading(false);
      return;
    }
    userIdRef.current = user.id;

    const { data, error: fetchError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    if (!data) {
      // No row yet — create one with defaults
      const { data: inserted, error: insertError } = await supabase
        .from('user_settings')
        .insert({ user_id: user.id, ...DEFAULT_SETTINGS })
        .select()
        .single();

      if (insertError) {
        setError(insertError.message);
        setSettings(DEFAULT_SETTINGS);
      } else {
        setSettings({ ...DEFAULT_SETTINGS, ...inserted });
      }
      setLoading(false);
      return;
    }

    setSettings({ ...DEFAULT_SETTINGS, ...data });
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = useCallback(async (updates: Partial<Settings>) => {
    // Optimistic UI update
    setSettings((prev) => ({ ...prev, ...updates }));

    const userId = userIdRef.current;
    if (!userId) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      userIdRef.current = user.id;
    }

    const { error: updateError } = await supabase
      .from('user_settings')
      .update(updates)
      .eq('user_id', userIdRef.current);

    if (updateError) {
      setError(updateError.message);
      // Roll back on failure by refetching the real state
      fetchSettings();
    }
  }, [fetchSettings]);

  return { settings, loading, error, updateSettings };
}