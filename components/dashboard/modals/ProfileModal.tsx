'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { Avatar } from '@/components/dashboard/Shared';
import { supabase } from '@/lib/supabase';
import { useProfile } from '@/hooks/useProfile';

const FONT_BODY = "'Inter', ui-sans-serif, system-ui, sans-serif";

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  user: any;
}

// NOTE: This modal now reads and writes through the SAME `useProfile` hook
// (and the same `profiles` table) that the Settings modal uses. That's the
// single source of truth — whatever you save here will show up in Settings
// immediately the next time it's opened, and vice versa. Username is no
// longer stored in auth user_metadata, only in `profiles.username`.
export function ProfileModal({ open, onClose, user }: ProfileModalProps) {
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [hydrated, setHydrated] = useState(false);

  const fallbackName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';

  // Populate fields as soon as data exists: fallback first, then the real
  // profile row once it loads — so the modal never shows an empty box.
  useEffect(() => {
    if (!open) return;
    setHydrated(false);
    setError('');
    setAvatarFile(null);
    setAvatarPreview(null);
    // Show a sane fallback immediately while the profile row loads
    setDisplayName(fallbackName);
    setUsername('');
  }, [open, fallbackName]);

  useEffect(() => {
    if (!open || hydrated) return;
    if (profile) {
      setDisplayName(profile.name || fallbackName);
      setUsername(profile.username || '');
      setHydrated(true);
    }
  }, [open, profile, hydrated, fallbackName]);

  if (!open) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB.');
      return;
    }
    setError('');
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    const trimmedName = displayName.trim();
    const trimmedUsername = username.trim().toLowerCase().replace(/\s+/g, '_');

    if (!trimmedName) {
      setError('Display name is required.');
      return;
    }
    if (!user?.id) {
      setError('You must be signed in to update your profile.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      let nextAvatarUrl = profile?.avatar_url ?? null;
      let avatarWarning = '';

      // Upload the new avatar to Supabase Storage first, if one was picked.
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop() || 'jpg';
        const path = `${user.id}/avatar.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(path, avatarFile, { upsert: true, cacheControl: '3600' });

        if (uploadError) {
          if (/bucket not found/i.test(uploadError.message)) {
            avatarWarning =
              'Photo upload isn\'t set up yet (missing "avatars" storage bucket). Your name and username were saved.';
          } else if (/row-level security/i.test(uploadError.message)) {
            avatarWarning =
              'Photo upload was blocked by a storage permission rule. Your name and username were saved — ask your developer to check the "avatars" bucket policies.';
          } else {
            throw uploadError;
          }
        } else {
          const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(path);
          // Cache-bust so the new image shows immediately everywhere it's rendered.
          nextAvatarUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;
        }
      }

      // Single write path — same `profiles` row that the Settings modal reads.
      await updateProfile({
        name: trimmedName,
        username: trimmedUsername,
        avatar_url: nextAvatarUrl ?? undefined,
      });

      setAvatarFile(null);
      setAvatarPreview(null);

      if (avatarWarning) {
        setError(avatarWarning);
      } else {
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const currentAvatarUrl = avatarPreview || profile?.avatar_url || undefined;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ fontFamily: FONT_BODY }}>
      <div className="absolute inset-0 bg-stone-900/25 backdrop-blur-[4px]" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-2xl p-7 border border-stone-100 shadow-[0_30px_80px_-20px_rgba(20,20,20,0.25)]">
        <h2 className="text-[19px] font-semibold text-stone-900 mb-6">Edit profile</h2>

        {/* Avatar */}
        <div className="flex justify-center mb-7">
          <div className="relative">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#0E6E5C]/40 focus:ring-offset-2"
              title="Change photo"
            >
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarPreview} alt="Avatar preview" className="w-24 h-24 rounded-full object-cover" />
              ) : (
                <Avatar name={displayName || fallbackName} src={currentAvatarUrl} size="lg" />
              )}
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Upload photo"
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white border border-stone-200 shadow-sm flex items-center justify-center hover:bg-stone-50 transition-colors"
            >
              <Camera className="w-3.5 h-3.5 text-stone-600" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        </div>

        {/* Fields */}
        <div className="space-y-3">
          <div className="border border-stone-200 rounded-xl px-3.5 py-2.5 focus-within:border-[#0E6E5C] focus-within:ring-2 focus-within:ring-[#0E6E5C]/10 transition-colors">
            <label className="block text-[11px] font-medium text-stone-400 mb-0.5">Display name</label>
            {profileLoading && !hydrated ? (
              <div className="h-5 w-2/3 rounded bg-stone-100 animate-pulse" />
            ) : (
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="w-full text-[14.5px] text-stone-800 outline-none bg-transparent"
              />
            )}
          </div>

          <div className="border border-stone-200 rounded-xl px-3.5 py-2.5 focus-within:border-[#0E6E5C] focus-within:ring-2 focus-within:ring-[#0E6E5C]/10 transition-colors">
            <label className="block text-[11px] font-medium text-stone-400 mb-0.5">Username</label>
            <div className="flex items-center">
              <span className="text-[14.5px] text-stone-400 mr-0.5">@</span>
              {profileLoading && !hydrated ? (
                <div className="h-5 w-1/2 rounded bg-stone-100 animate-pulse" />
              ) : (
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                  placeholder="username"
                  className="w-full text-[14.5px] text-stone-800 outline-none bg-transparent"
                />
              )}
            </div>
          </div>
        </div>

        {error && <p className="mt-3 text-[12.5px] text-red-600">{error}</p>}

        <p className="mt-4 text-[12px] text-stone-400 leading-relaxed">
          Your profile helps people recognize you in shared reports and team workspaces.
        </p>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full text-[13.5px] font-semibold text-stone-600 hover:bg-stone-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !displayName.trim()}
            className="px-4 py-2 rounded-full text-[13.5px] font-semibold bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-40 transition-colors flex items-center gap-1.5"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfileModal;