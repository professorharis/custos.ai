'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface Profile {
  id: string;
  email: string | null;
  name: string | null;
  username: string | null;
  avatar_url: string | null;
  plan: string | null;
}

// profile === undefined  -> still loading (initial fetch not finished)
// profile === null       -> loaded, but no row exists yet
// profile === Profile    -> loaded successfully
export function useProfile() {
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setError(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setProfile(null);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('id, email, name, username, avatar_url, plan')
      .eq('id', user.id)
      .maybeSingle();

    if (fetchError) {
      setError(fetchError.message);
      // fall back to auth metadata so the UI still has something useful
      setProfile({
        id: user.id,
        email: user.email ?? null,
        name: (user.user_metadata?.name as string) ?? null,
        username: null,
        avatar_url: (user.user_metadata?.avatar_url as string) ?? null,
        plan: null,
      });
      return;
    }

    if (!data) {
      // No profiles row yet — create one so future saves have something to update
      const newProfile = {
        id: user.id,
        email: user.email ?? null,
        name: (user.user_metadata?.name as string) ?? null,
        username: null,
        avatar_url: (user.user_metadata?.avatar_url as string) ?? null,
        plan: 'Free',
      };
      const { data: inserted, error: insertError } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .single();

      if (insertError) {
        setError(insertError.message);
        setProfile(newProfile as Profile);
      } else {
        setProfile(inserted as Profile);
      }
      return;
    }

    setProfile(data as Profile);
  }, []);

  useEffect(() => {
    fetchProfile();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile();
      } else {
        setProfile(null);
      }
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const updateProfile = useCallback(
    async (updates: Partial<Pick<Profile, 'name' | 'username' | 'avatar_url'>>) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');

      // Username uniqueness check (skip if unchanged)
      if (updates.username && updates.username !== profile?.username) {
        const { data: existing, error: checkError } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', updates.username)
          .neq('id', user.id)
          .maybeSingle();

        if (checkError) throw new Error(checkError.message);
        if (existing) throw new Error('That username is already taken.');
      }

      const { data, error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) throw new Error(updateError.message);

      setProfile(data as Profile);
      return data as Profile;
    },
    [profile]
  );

  const deleteAccount = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not signed in');

    // Requires a server-side route with the service role key —
    // client cannot delete an auth user directly.
    const res = await fetch('/api/account/delete', { method: 'POST' });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error || 'Failed to delete account');
    }
  }, []);

  return {
    profile,
    loading: profile === undefined,
    error,
    updateProfile,
    deleteAccount,
    refetch: fetchProfile,
  };
}