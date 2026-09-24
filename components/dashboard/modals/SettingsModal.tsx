'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  SlidersHorizontal,
  UserCog,
  Bell,
  Lock,
  CreditCard,
  ShieldCheck,
  Keyboard,
  LogOut,
  Check,
  Loader2,
  Monitor,
  Smartphone,
  AlertTriangle,
  ChevronRight,
  Camera,
} from 'lucide-react';
import { Avatar } from '@/components/dashboard/Shared';
import { useProfile } from '@/hooks/useProfile';
import { useSettings } from '@/hooks/useSettings';
import { supabase } from '@/lib/supabase';

const FONT_BODY = "'Inter', ui-sans-serif, system-ui, sans-serif";
const ACCENT = '#2563EB';
const ACCENT_HOVER = '#1D4ED8';

export type SettingsSection =
  | 'general'
  | 'account'
  | 'notifications'
  | 'privacy'
  | 'billing'
  | 'security'
  | 'shortcuts';

interface SettingsModalProps {
  open: boolean;
  initialSection?: SettingsSection;
  onClose: () => void;
  user: any;
  onLogout: () => void;
}

const NAV = [
  { id: 'general', label: 'General', icon: SlidersHorizontal },
  { id: 'account', label: 'Account', icon: UserCog },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Privacy', icon: Lock },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'security', label: 'Security', icon: ShieldCheck },
  { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: Keyboard },
] as const;

// ─── Shared components ──────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[18px] font-semibold text-stone-900 mb-1">{children}</h2>;
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[14px] font-semibold text-stone-800 mt-6 mb-2 first:mt-4">{children}</h3>;
}

function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="max-w-[180px] shrink-0">
        <p className="text-[13px] font-medium text-stone-800">{label}</p>
        {hint && <p className="text-[11px] text-stone-400 mt-0.5 leading-snug">{hint}</p>}
      </div>
      <div className="flex-1 flex justify-end min-w-0">{children}</div>
    </div>
  );
}

// Clickable row used for Username — plain text + chevron, tapping opens a popup
function ClickableRow({ label, value, onClick }: { label: string; value: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between gap-4 py-3 text-left group">
      <span className="text-[13px] font-medium text-stone-800">{label}</span>
      <span className="flex items-center gap-1 text-[13px] text-stone-500">
        {value}
        <ChevronRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-stone-400 transition-colors" />
      </span>
    </button>
  );
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`rounded-md bg-stone-100 animate-pulse ${className}`} />;
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex items-center bg-stone-100/80 rounded-xl p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all whitespace-nowrap ${
            value === opt.value ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`w-10 h-6 rounded-full relative transition-colors flex-shrink-0 ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      style={{ backgroundColor: checked ? ACCENT : '#E7E5E4' }}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`text-[13px] px-3 py-1.5 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-blue-500/20 bg-white transition-colors w-full min-w-0 ${
        props.className ?? ''
      }`}
    />
  );
}

function PrimaryButton({
  children,
  disabled,
  loading,
  onClick,
  className = '',
}: {
  children: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`px-4 py-1.5 rounded-xl text-[12.5px] font-semibold text-white disabled:opacity-50 flex items-center gap-1.5 transition-colors whitespace-nowrap ${className}`}
      style={{ backgroundColor: hover && !disabled ? ACCENT_HOVER : ACCENT }}
    >
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {children}
    </button>
  );
}

const GoogleLogo = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    <path fill="none" d="M0 0h48v48H0z" />
  </svg>
);

// ─── Modal shell used by the smaller popups (username edit, 2FA info) ──

function MiniModal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-stone-900/20 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-stone-100">
        {children}
      </div>
    </div>
  );
}

// ─── Username edit popup ────────────────────────────────────────────

function UsernameEditModal({
  currentUsername,
  onClose,
  onSave,
}: {
  currentUsername: string;
  onClose: () => void;
  onSave: (value: string) => Promise<void>;
}) {
  const [value, setValue] = useState(currentUsername);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    const trimmed = value.trim().toLowerCase().replace(/[^a-z0-9_.]/g, '');
    if (!trimmed) {
      setError('Username cannot be empty.');
      return;
    }
    if (trimmed === currentUsername) {
      onClose();
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave(trimmed);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Could not update username.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MiniModal onClose={onClose}>
      <h3 className="text-[16px] font-semibold text-stone-900 mb-1">Edit username</h3>
      <p className="text-[13px] text-stone-500 mb-4">Lowercase letters, numbers, underscores and dots only.</p>
      <div className="flex items-center gap-2 border border-stone-200 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-colors">
        <span className="text-[13.5px] text-stone-400">@</span>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          className="flex-1 text-[13.5px] text-stone-800 outline-none bg-transparent"
        />
      </div>
      {error && <p className="text-[12.5px] text-red-600 mt-2">{error}</p>}
      <div className="flex items-center justify-end gap-2 mt-5">
        <button
          onClick={onClose}
          disabled={saving}
          className="px-4 py-2 rounded-xl text-[13px] font-medium text-stone-600 hover:bg-stone-100 disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
        <PrimaryButton onClick={handleSave} loading={saving} disabled={saving}>
          Save
        </PrimaryButton>
      </div>
    </MiniModal>
  );
}

// ─── Two-Factor "coming soon" popup ─────────────────────────────────

function TwoFactorModal({ onClose }: { onClose: () => void }) {
  return (
    <MiniModal onClose={onClose}>
      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-3">
        <ShieldCheck className="w-5 h-5 text-blue-600" />
      </div>
      <h3 className="text-[16px] font-semibold text-stone-900 mb-1.5">Two-Factor Authentication</h3>
      <p className="text-[13.5px] text-stone-600 leading-relaxed mb-1">
        Add an extra layer of security to your account.
      </p>
      <p className="text-[13px] text-stone-400 leading-relaxed mb-5">
        This feature is currently under development and will be available in a future update.
      </p>
      <div className="flex justify-end">
        <PrimaryButton onClick={onClose}>Got it</PrimaryButton>
      </div>
    </MiniModal>
  );
}

// ─── Delete Account Popup ─────────────────────────────────────────

function DeleteAccountPopup({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => Promise<void> }) {
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const canDelete = confirmText.trim().toLowerCase() === 'delete';

  const handleConfirm = async () => {
    if (!canDelete) return;
    setDeleting(true);
    setError('');
    try {
      await onConfirm();
    } catch (err: any) {
      setError(err?.message || 'Could not delete account');
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-stone-900/20 backdrop-blur-[2px]" onClick={!deleting ? onCancel : undefined} />
      <div className="relative w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-red-100">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-stone-900">Delete account?</h3>
            <p className="text-sm text-stone-500">This action cannot be undone.</p>
          </div>
        </div>
        <div className="bg-stone-50 rounded-xl p-4 mb-4">
          <p className="text-sm text-stone-600 leading-relaxed">
            Deleting your account permanently removes your profile, scan history, and all associated data.
          </p>
        </div>
        <label className="text-sm font-medium text-stone-700 block mb-1.5">
          Type <span className="font-semibold text-stone-900">delete</span> to confirm
        </label>
        <TextInput
          autoFocus
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="delete"
          className="w-full mb-1"
        />
        {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
        <div className="flex items-center justify-end gap-3 mt-5">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="px-4 py-2 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-100 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canDelete || deleting}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 flex items-center gap-2 transition-colors"
          >
            {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
            {deleting ? 'Deleting…' : 'Delete account'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── General ─────────────────────────────────────────────────────────

function GeneralSection() {
  const { settings, updateSettings } = useSettings();

  return (
    <div>
      <SectionHeading>General</SectionHeading>
      <p className="text-sm text-stone-400 mb-4">App-wide preferences for how Custos behaves and looks.</p>

      <FieldRow label="Appearance">
        <Segmented
          value={settings.theme}
          onChange={(v) => updateSettings({ theme: v })}
          options={[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
            { value: 'system', label: 'System' },
          ]}
        />
      </FieldRow>

      <FieldRow label="Language" hint="Interface language">
        <select
          value={settings.language}
          onChange={(e) => updateSettings({ language: e.target.value })}
          className="text-[13px] px-3 py-1.5 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-blue-500/20 bg-white w-full max-w-[200px]"
        >
          <option value="en">English</option>
          <option value="ur">اردو</option>
          <option value="hi">हिन्दी</option>
          <option value="ar">العربية</option>
        </select>
      </FieldRow>

      <FieldRow label="Default report view" hint="Which report layout opens by default">
        <Segmented
          value={settings.default_report_view}
          onChange={(v) => updateSettings({ default_report_view: v })}
          options={[
            { value: 'document', label: 'Document' },
            { value: 'presentation', label: 'Presentation' },
          ]}
        />
      </FieldRow>
    </div>
  );
}

// ─── Account ──────────────────────────────────────────────────────────
// Name is READ-ONLY here (no edit box) — it always mirrors profile.name.
// Username is READ-ONLY inline; tapping it opens a popup to edit.
// Everything shown comes straight from useProfile (same source the
// sidebar's AvatarMenu should read from, so name/avatar/username stay
// in sync everywhere the moment they change here).

function AccountSection({ user, onLogout, onClose }: { user: any; onLogout: () => void; onClose: () => void }) {
  const { profile, loading: profileLoading, updateProfile, deleteAccount } = useProfile();

  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stillLoading = profileLoading && !profile;

  const displayName = profile?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const email = profile?.email || user?.email || '';
  const currentUsername = profile?.username || (email.split('@')[0] || 'user').toLowerCase();

  const handleAvatarPick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    setAvatarError('');
    setAvatarUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, cacheControl: '3600' });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const avatarUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;
      await updateProfile({ avatar_url: avatarUrl });
    } catch (err: any) {
      setAvatarError(err?.message || 'Upload failed');
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const saveUsername = async (value: string) => {
    // Check availability before writing, so two people can't collide.
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', value)
      .maybeSingle();
    if (existing && existing.id !== user?.id) {
      throw new Error('That username is already taken.');
    }
    await updateProfile({ username: value });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onClose();
    onLogout();
  };

  const handleDeleteConfirmed = async () => {
    await deleteAccount();
    setShowDeletePopup(false);
    onClose();
    onLogout();
  };

  return (
    <div>
      <SectionHeading>Account</SectionHeading>

      {/* Avatar — skeleton until the profile row (and thus avatar_url) has loaded */}
      <FieldRow label="Avatar" hint={avatarError || undefined}>
        {stillLoading ? (
          <Skeleton className="w-9 h-9 rounded-full" />
        ) : (
          <div className="relative">
            <div className="rounded-full ring-2 ring-stone-100 ring-offset-2">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={displayName} className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <Avatar name={displayName} size="sm" />
              )}
            </div>
            <button
              title="Change avatar"
              onClick={handleAvatarPick}
              disabled={avatarUploading}
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border border-stone-200 flex items-center justify-center hover:bg-stone-50"
            >
              {avatarUploading ? (
                <Loader2 className="w-2.5 h-2.5 text-stone-500 animate-spin" />
              ) : (
                <Camera className="w-2.5 h-2.5 text-stone-500" />
              )}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
        )}
      </FieldRow>

      {/* Name — read-only, no input box, always mirrors the profile */}
      <FieldRow label="Name">
        {stillLoading ? <Skeleton className="h-4 w-28" /> : (
          <span className="text-[13px] text-stone-700 font-medium">{displayName}</span>
        )}
      </FieldRow>

      {/* Username — read-only row; tap opens the edit popup */}
      {stillLoading ? (
        <div className="flex items-center justify-between gap-4 py-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
      ) : (
        <ClickableRow label="Username" value={`@${currentUsername}`} onClick={() => setShowUsernameModal(true)} />
      )}

      <FieldRow label="Email">
        <span className="text-sm text-stone-500 truncate">{stillLoading ? <Skeleton className="h-4 w-32" /> : email}</span>
      </FieldRow>

      <FieldRow label="Log out">
        <button
          onClick={handleLogout}
          className="px-4 py-1.5 rounded-xl text-sm font-medium border border-stone-200 text-stone-700 hover:bg-stone-50 flex items-center gap-2 transition-colors whitespace-nowrap"
        >
          <LogOut className="w-4 h-4" />
          Log out
        </button>
      </FieldRow>

      <FieldRow label="Delete account">
        <button
          onClick={() => setShowDeletePopup(true)}
          className="px-4 py-1.5 rounded-xl text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors whitespace-nowrap"
        >
          Delete
        </button>
      </FieldRow>

      {showUsernameModal && (
        <UsernameEditModal
          currentUsername={currentUsername}
          onClose={() => setShowUsernameModal(false)}
          onSave={saveUsername}
        />
      )}

      {showDeletePopup && (
        <DeleteAccountPopup onCancel={() => setShowDeletePopup(false)} onConfirm={handleDeleteConfirmed} />
      )}
    </div>
  );
}

// ─── Notifications ──────────────────────────────────────────────────

function NotificationsSection() {
  const { settings, updateSettings } = useSettings();

  return (
    <div>
      <SectionHeading>Notifications</SectionHeading>
      <p className="text-sm text-stone-400 mb-4">Choose what Custos should email you about.</p>
      <FieldRow label="Email notifications" hint="Alerts for high-risk scans">
        <Toggle checked={settings.notifications_enabled} onChange={(v) => updateSettings({ notifications_enabled: v })} />
      </FieldRow>
      <FieldRow label="Product updates" hint="News about new features">
        <Toggle checked={settings.product_updates_enabled} onChange={(v) => updateSettings({ product_updates_enabled: v })} />
      </FieldRow>
    </div>
  );
}

// ─── Privacy ──────────────────────────────────────────────────────────

function PrivacySection({ user }: { user: any }) {
  const [exporting, setExporting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [status, setStatus] = useState('');

  const exportData = async () => {
    if (!user?.id) return;
    setExporting(true);
    setStatus('');
    try {
      const { data, error } = await supabase.from('scans').select('*').eq('user_id', user.id);
      if (error) throw error;
      const blob = new Blob([JSON.stringify(data ?? [], null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'custos-scan-history.json';
      a.click();
      URL.revokeObjectURL(url);
      setStatus('Exported ✓');
    } catch (err: any) {
      setStatus(err?.message || 'Export failed');
    } finally {
      setExporting(false);
      setTimeout(() => setStatus(''), 2000);
    }
  };

  const clearHistory = async () => {
    if (!user?.id) return;
    if (!window.confirm('Delete all scan history? This cannot be undone.')) return;
    setClearing(true);
    setStatus('');
    try {
      const { error } = await supabase.from('scans').delete().eq('user_id', user.id);
      if (error) throw error;
      setStatus('History cleared ✓');
    } catch (err: any) {
      setStatus(err?.message || 'Could not clear history');
    } finally {
      setClearing(false);
      setTimeout(() => setStatus(''), 2000);
    }
  };

  return (
    <div>
      <SectionHeading>Privacy</SectionHeading>
      <p className="text-sm text-stone-500 leading-relaxed mb-4">
        Scanned content is processed to detect scams and phishing, then stored in your private history. Only you can see your scans — enforced by row-level security.
      </p>

      <FieldRow label="Export scan history" hint="Download all your scans as JSON">
        <button
          onClick={exportData}
          disabled={exporting}
          className="px-4 py-1.5 rounded-xl text-sm font-medium border border-stone-200 text-stone-700 hover:bg-stone-50 disabled:opacity-50 flex items-center gap-2 transition-colors whitespace-nowrap"
        >
          {exporting && <Loader2 className="w-4 h-4 animate-spin" />}
          {exporting ? 'Exporting…' : 'Export'}
        </button>
      </FieldRow>

      <FieldRow label="Clear scan history" hint="Delete all past scans, keep your account">
        <button
          onClick={clearHistory}
          disabled={clearing}
          className="px-4 py-1.5 rounded-xl text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50 flex items-center gap-2 transition-colors whitespace-nowrap"
        >
          {clearing && <Loader2 className="w-4 h-4 animate-spin" />}
          {clearing ? 'Clearing…' : 'Clear history'}
        </button>
      </FieldRow>

      {status && <p className="text-sm text-stone-500 mt-2">{status}</p>}

      <a href="/privacy" className="text-sm font-medium text-blue-600 hover:underline mt-3 inline-block">
        Read the full privacy policy →
      </a>
    </div>
  );
}

// ─── Billing ──────────────────────────────────────────────────────────

const PRO_FEATURES = [
  'Unlimited scans – no daily limit',
  'Priority AI – faster, more detailed reports',
  'Export reports as PDF & CSV',
  'Full searchable scan history with filters',
  'Advanced security: Two‑Factor Authentication',
  'Priority email support',
];

function BillingSection() {
  const { profile } = useProfile();
  const [loadingPortal, setLoadingPortal] = useState(false);
  const isPro = profile?.plan === 'Pro';

  const goToUpgrade = async () => {
    setLoadingPortal(true);
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const data = await res.json();
      if (data?.url) window.location.href = data.url;
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPortal(false);
    }
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-base font-semibold text-stone-900">{isPro ? 'Pro plan' : 'Free plan'}</p>
            <p className="text-xs text-stone-400">{isPro ? 'Thanks for being Pro' : 'Unlock more with Custos Pro'}</p>
          </div>
        </div>
        {!isPro ? (
          <PrimaryButton onClick={goToUpgrade} loading={loadingPortal}>
            Upgrade to Pro
          </PrimaryButton>
        ) : (
          <button
            onClick={goToUpgrade}
            disabled={loadingPortal}
            className="px-4 py-1.5 rounded-xl text-sm font-medium border border-stone-200 text-stone-700 hover:bg-stone-50 disabled:opacity-60 transition-colors whitespace-nowrap"
          >
            {loadingPortal ? 'Loading…' : 'Manage billing'}
          </button>
        )}
      </div>

      <div className="bg-stone-50 rounded-2xl p-4">
        {PRO_FEATURES.map((feature) => (
          <div key={feature} className="flex items-center gap-3 py-1.5">
            <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span className="text-sm text-stone-700">{feature}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Security ─────────────────────────────────────────────────────────
// Password row is fully hidden for Google-only accounts (no email/password
// identity at all). Where a password exists, changing it requires the
// CURRENT password to be re-verified against Supabase Auth first — if it
// doesn't match, nothing is saved and an inline error is shown.
// Two-Factor Authentication is a single button that opens an honest
// "coming soon" popup instead of a working toggle.

function SecuritySection({ user }: { user: any }) {
  const [linkingGoogle, setLinkingGoogle] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);

  const hasGoogleIdentity = useMemo(() => {
    const identities = user?.identities || [];
    return identities.some((identity: any) => identity.provider === 'google');
  }, [user]);

  const hasEmailIdentity = useMemo(() => {
    const identities = user?.identities || [];
    return identities.some((i: any) => i.provider === 'email');
  }, [user]);

  // Only show password management for accounts that actually have an
  // email/password identity. Pure Google sign-ups have nothing to change.
  const showPasswordOption = hasEmailIdentity;

  const handleConnectGoogle = async () => {
    setLinkingGoogle(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/settings?link=true' },
      });
      if (error) throw error;
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLinkingGoogle(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError('');

    if (!currentPw) {
      setPasswordError('Enter your current password.');
      return;
    }
    if (newPw.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (newPw !== confirmPw) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setChangingPassword(true);
    try {
      // Verify the current password actually matches before allowing any
      // change — re-authenticate against Supabase with the entered value.
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: user?.email,
        password: currentPw,
      });
      if (reauthError) {
        setPasswordError('Current password is incorrect.');
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) throw error;

      setPasswordSuccess(true);
      setShowPasswordForm(false);
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password.');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div>
      <SectionHeading>Security</SectionHeading>
      <p className="text-sm text-stone-400 mb-4">Manage your account security and connections.</p>

      <FieldRow label="Google Connected" hint="Link your Google account for easy login">
        {hasGoogleIdentity ? (
          <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-1.5 rounded-xl border border-green-200 whitespace-nowrap">
            <GoogleLogo className="w-4 h-4" />
            <span className="text-sm font-medium">Connected</span>
            <span className="text-xs text-stone-500 ml-1 truncate max-w-[100px]">
              {user?.identities?.find((i: any) => i.provider === 'google')?.identity_data?.email || ''}
            </span>
          </div>
        ) : (
          <button
            onClick={handleConnectGoogle}
            disabled={linkingGoogle}
            className="px-4 py-1.5 rounded-xl text-sm font-medium border border-stone-200 text-stone-700 hover:bg-stone-50 disabled:opacity-50 flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            {linkingGoogle ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleLogo className="w-4 h-4" />}
            {linkingGoogle ? 'Connecting…' : 'Connect Google'}
          </button>
        )}
      </FieldRow>

      {/* Password — hidden entirely for Google-only accounts */}
      {showPasswordOption && (
        <FieldRow label="Password" hint="Change your login password">
          {showPasswordForm ? (
            <div className="flex flex-col gap-2 w-full max-w-[240px]">
              <TextInput
                type="password"
                placeholder="Current password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
              />
              <TextInput
                type="password"
                placeholder="New password (min 6 chars)"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
              />
              <TextInput
                type="password"
                placeholder="Confirm new password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
              />
              {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleChangePassword}
                  disabled={changingPassword}
                  className="px-4 py-1.5 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                >
                  {changingPassword && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {changingPassword ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordError('');
                    setCurrentPw('');
                    setNewPw('');
                    setConfirmPw('');
                  }}
                  className="px-3 py-1.5 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {passwordSuccess && <span className="text-sm text-green-600">Updated ✓</span>}
              <button
                onClick={() => setShowPasswordForm(true)}
                className="px-4 py-1.5 rounded-xl text-sm font-medium border border-stone-200 text-stone-700 hover:bg-stone-50 flex items-center gap-2 transition-colors whitespace-nowrap"
              >
                Change password
              </button>
            </div>
          )}
        </FieldRow>
      )}

      <FieldRow label="Two-Factor Authentication" hint="Extra layer of security for your account">
        <button
          onClick={() => setShowTwoFactorModal(true)}
          className="px-4 py-1.5 rounded-xl text-sm font-medium border border-stone-200 text-stone-700 hover:bg-stone-50 transition-colors whitespace-nowrap"
        >
          Enable
        </button>
      </FieldRow>

      <SubHeading>Active sessions</SubHeading>
      <div className="bg-stone-50/80 rounded-2xl p-3 flex items-center gap-3 mt-2">
        {typeof navigator !== 'undefined' && /Mobi/i.test(navigator.userAgent) ? (
          <Smartphone className="w-5 h-5 text-stone-400 flex-shrink-0" />
        ) : (
          <Monitor className="w-5 h-5 text-stone-400 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-stone-700">This device</p>
          <p className="text-xs text-stone-400 truncate">{user?.email} — current session</p>
        </div>
        <span className="text-xs font-semibold text-green-700 bg-green-50 px-3 py-1 rounded-full flex-shrink-0">Active</span>
      </div>

      {showTwoFactorModal && <TwoFactorModal onClose={() => setShowTwoFactorModal(false)} />}
    </div>
  );
}

// ─── Keyboard Shortcuts ──────────────────────────────────────────────

function KeyBadge({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[24px] text-center text-[11px] font-medium px-2 py-1 rounded-lg bg-stone-100 text-stone-600 border border-stone-200 whitespace-nowrap">
      {children}
    </kbd>
  );
}

const SHORTCUT_GROUPS = [
  {
    title: 'General',
    items: [
      { keys: ['Ctrl', 'K'], label: 'Quick chat or search' },
      { keys: ['Ctrl', '⇧', 'I'], label: 'Incognito chat' },
      { keys: ['Ctrl', '.'], label: 'Toggle sidebar' },
      { keys: ['Ctrl', '/'], label: 'Keyboard shortcuts' },
      { keys: ['Ctrl', '⇧', ','], label: 'Settings' },
    ],
  },
  {
    title: 'In scans',
    items: [
      { keys: ['Enter'], label: 'Run scan' },
      { keys: ['⇧', 'Enter'], label: 'New line in message' },
      { keys: ['Ctrl', '⇧', 'E'], label: 'Export current report' },
      { keys: ['Esc'], label: 'Close report panel' },
    ],
  },
];

function ShortcutsSection() {
  return (
    <div>
      <SectionHeading>Keyboard Shortcuts</SectionHeading>
      <p className="text-sm text-stone-400 mb-4">Move faster through Custos. On macOS, use ⌘ instead of Ctrl.</p>

      {SHORTCUT_GROUPS.map((group) => (
        <div key={group.title} className="mb-4 last:mb-0">
          <p className="text-sm font-semibold text-stone-800 mb-1.5">{group.title}</p>
          {group.items.map((s) => (
            <div key={s.label} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-stone-600 truncate mr-2">{s.label}</span>
              <div className="flex items-center gap-1 flex-wrap flex-shrink-0">
                {s.keys.map((k, idx) => (
                  <KeyBadge key={idx}>{k}</KeyBadge>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Main Modal ──────────────────────────────────────────────────────

export function SettingsModal({ open, initialSection = 'account', onClose, user, onLogout }: SettingsModalProps) {
  const [section, setSection] = useState<SettingsSection>(initialSection);
  const { profile, loading: profileLoading } = useProfile();

  useEffect(() => {
    if (open) setSection(initialSection);
  }, [open, initialSection]);

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

  const displayName = profile?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const footerLoading = profileLoading && !profile;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ fontFamily: FONT_BODY }}>
      {/* Subtle backdrop */}
      <div className="absolute inset-0 bg-stone-900/20 backdrop-blur-[2px]" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-3xl h-[75vh] max-h-[600px] bg-white rounded-2xl overflow-hidden flex border border-stone-100/80 shadow-2xl">
        {/* Left rail */}
        <div className="w-48 flex-shrink-0 bg-[#FAFAF8] border-r border-stone-100/80 flex flex-col py-4 overflow-y-auto">
          <div className="px-4 pb-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Settings</p>
          </div>

          <nav className="px-2 space-y-0.5">
            {NAV.map((item) => (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12.5px] font-medium transition-all ${
                  section === item.id
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'text-stone-500 hover:bg-white/50 hover:text-stone-700'
                }`}
              >
                <item.icon className="w-4 h-4" style={{ color: section === item.id ? ACCENT : '#A8A29E' }} />
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Footer identity — same profile source as Account, so it never
              drifts from what's shown/edited above. Skeleton until the
              profile row (name + avatar_url) has actually loaded. */}
          <div className="mt-auto px-4 pt-3 border-t border-stone-100/80 flex items-center gap-2.5">
            {footerLoading ? (
              <>
                <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Skeleton className="h-2.5 w-20" />
                  <Skeleton className="h-2 w-14" />
                </div>
              </>
            ) : (
              <>
                <div className="rounded-full ring-2 ring-stone-100 ring-offset-1 flex-shrink-0">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={displayName} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <Avatar name={displayName} size="sm" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-stone-800 truncate">{displayName}</p>
                  <p className="text-xs text-stone-400 truncate">{user?.email}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right content */}
        <div className="flex-1 min-w-0 flex flex-col bg-white overflow-hidden">
          <div className="flex items-center justify-end px-5 py-2.5 flex-shrink-0 border-b border-stone-100/80">
            <button onClick={onClose} title="Close" className="p-1.5 rounded-xl text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 py-4">
            {section === 'general' && <GeneralSection />}
            {section === 'account' && <AccountSection user={user} onLogout={onLogout} onClose={onClose} />}
            {section === 'notifications' && <NotificationsSection />}
            {section === 'privacy' && <PrivacySection user={user} />}
            {section === 'billing' && <BillingSection />}
            {section === 'security' && <SecuritySection user={user} />}
            {section === 'shortcuts' && <ShortcutsSection />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;