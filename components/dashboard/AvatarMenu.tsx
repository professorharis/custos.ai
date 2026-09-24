'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  BarChart3,
  Sparkles,
  Settings,
  LifeBuoy,
  LogOut,
  ChevronRight,
  BookOpen,
  Shield,
  MessageCircle,
  Bug,
  Send,
  Keyboard,
} from 'lucide-react';
import { Avatar } from '@/components/dashboard/Shared';
import { useScanHistory } from '@/hooks/useScanHistory';
import { useProfile } from '@/hooks/useProfile';

const FONT_BODY = "'Inter', ui-sans-serif, system-ui, sans-serif";

export type AvatarModalType = 'profile' | 'usage' | 'settings' | 'feedback' | 'bug' | 'shortcuts';

interface AvatarMenuProps {
  user: any;
  onLogout: () => void;
  /** Opens the matching modal (ProfileModal, UsageModal, SettingsModal, FeedbackModal, BugReportModal, ShortcutsModal). */
  onOpenModal: (type: AvatarModalType) => void;
  plan?: 'Free' | 'Pro';
  /** Full sidebar footer row (name + plan visible) instead of just the avatar bubble. */
  expanded?: boolean;
}

export function AvatarMenu({ user, onLogout, onOpenModal, plan: planProp, expanded = false }: AvatarMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const helpCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { usage } = useScanHistory();
  const { profile } = useProfile();

  // Real Supabase profile row wins; fall back to auth metadata, then a prop
  // override, so the menu never shows a blank name/plan while loading.
  // profile?.avatar_url is the single source of truth for the picture too —
  // when nothing has been uploaded yet, Avatar's `src` prop is undefined/null
  // and it falls back to the initials bubble automatically; once a photo is
  // saved, this same avatar_url is what renders everywhere instantly.
  const displayName = profile?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const email = profile?.email || user?.email || '';

  // `profile.plan` comes back from Supabase as a plain string, but the UI
  // only recognises two values. Narrow it here so `plan` has the strict
  // union type, and anything unexpected (old data, typos, case differences,
  // null) falls back to the prop override or 'Free'.
  const rawPlan = (profile?.plan ?? planProp ?? '').toString();
  const plan: 'Free' | 'Pro' = rawPlan.toLowerCase() === 'pro' ? 'Pro' : 'Free';

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setHelpOpen(false);
      }
    };
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setHelpOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', escHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', escHandler);
    };
  }, [open]);

  // Opens one of the modals (Profile/Usage/Settings/Feedback/Bug/Shortcuts).
  const openModal = (type: AvatarModalType) => {
    onOpenModal(type);
    setOpen(false);
    setHelpOpen(false);
  };

  // Still page-navigates for things that genuinely are separate pages
  // (Help Center, Privacy & Terms, Contact Support).
  const go = (path: string) => {
    router.push(path);
    setOpen(false);
    setHelpOpen(false);
  };

  const openHelp = () => {
    if (helpCloseTimer.current) clearTimeout(helpCloseTimer.current);
    setHelpOpen(true);
  };
  const scheduleCloseHelp = () => {
    if (helpCloseTimer.current) clearTimeout(helpCloseTimer.current);
    helpCloseTimer.current = setTimeout(() => setHelpOpen(false), 150);
  };

  const rowClass =
    'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-stone-700 hover:bg-stone-50 transition-colors';

  return (
    <div className={`relative ${expanded ? 'w-full' : ''}`} ref={ref}>
      {expanded ? (
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-stone-100/70 transition-colors outline-none"
        >
          <div className="rounded-full ring-2 ring-stone-100 ring-offset-2">
            <Avatar name={displayName} src={profile?.avatar_url} size="sm" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold text-stone-800 truncate">{displayName}</p>
            <p className="text-xs text-stone-400 truncate">{plan === 'Pro' ? 'Pro plan' : 'Free plan'}</p>
          </div>
        </button>
      ) : (
        <button
          onClick={() => setOpen((o) => !o)}
          title={displayName}
          className="flex items-center gap-2 rounded-full outline-none"
        >
          <div className="rounded-full ring-2 ring-stone-100 ring-offset-2">
            <Avatar name={displayName} src={profile?.avatar_url} size="sm" />
          </div>
        </button>
      )}

      {open && (
        // Anchored to the left edge of the trigger (rather than the right)
        // so that it stays fully on-screen whether the sidebar is expanded
        // (w-64) or collapsed to the narrow icon rail (w-14).
        <div
          className="absolute left-0 bottom-full mb-2 w-64 bg-white rounded-2xl overflow-visible z-50 border border-stone-100 shadow-[0_20px_60px_-15px_rgba(20,20,20,0.18)]"
          style={{ fontFamily: FONT_BODY }}
        >
          {/* Header: email only, no avatar/name duplicated here */}
          <div className="px-4 py-3.5 border-b border-stone-100">
            <p className="text-[12px] text-stone-500 truncate">{email}</p>
          </div>

          <div className="p-1.5 space-y-0.5">
            <button className={rowClass} onClick={() => openModal('profile')}>
              <User className="w-4 h-4 text-stone-400" />
              Profile
            </button>

            <button className={rowClass} onClick={() => openModal('usage')}>
              <BarChart3 className="w-4 h-4 text-stone-400" />
              <span className="flex-1 text-left">Usage</span>
              {usage && (
                <span className="text-[11px] text-stone-400 font-normal">
                  {usage.scansToday}/10 today
                </span>
              )}
            </button>

            {plan !== 'Pro' && (
              <button
                className={`${rowClass} text-[#0E6E5C] hover:bg-[#0E6E5C]/5`}
                onClick={() => go('/upgrade')}
              >
                <Sparkles className="w-4 h-4 text-[#0E6E5C]" />
                Upgrade to Pro
              </button>
            )}

            <button className={rowClass} onClick={() => openModal('settings')}>
              <Settings className="w-4 h-4 text-stone-400" />
              Settings
            </button>

            {/* Help & Support: hover opens a flyout to the right, like Claude's own menu */}
            <div
              className="relative"
              onMouseEnter={openHelp}
              onMouseLeave={scheduleCloseHelp}
            >
              <button
                className={rowClass}
                onClick={() => setHelpOpen((o) => !o)}
              >
                <LifeBuoy className="w-4 h-4 text-stone-400" />
                <span className="flex-1 text-left">Help &amp; Support</span>
                <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
              </button>

              {helpOpen && (
                <div
                  className="absolute left-full bottom-0 ml-1 w-56 bg-white rounded-2xl overflow-hidden z-50 border border-stone-100 shadow-[0_20px_60px_-15px_rgba(20,20,20,0.18)]"
                  onMouseEnter={openHelp}
                  onMouseLeave={scheduleCloseHelp}
                >
                  <div className="p-1.5 space-y-0.5">
                    <button className={rowClass} onClick={() => go('/help-center')}>
                      <BookOpen className="w-4 h-4 text-stone-400" />
                      Help Center
                    </button>
                    <button className={rowClass} onClick={() => go('/privacy')}>
                      <Shield className="w-4 h-4 text-stone-400" />
                      Privacy &amp; Terms
                    </button>
                    <button className={rowClass} onClick={() => go('/support')}>
                      <MessageCircle className="w-4 h-4 text-stone-400" />
                      Contact Support
                    </button>
                    <button className={rowClass} onClick={() => openModal('bug')}>
                      <Bug className="w-4 h-4 text-stone-400" />
                      Report a Bug
                    </button>
                    <button className={rowClass} onClick={() => openModal('feedback')}>
                      <Send className="w-4 h-4 text-stone-400" />
                      Send Feedback
                    </button>
                    <button className={rowClass} onClick={() => openModal('shortcuts')}>
                      <Keyboard className="w-4 h-4 text-stone-400" />
                      Keyboard Shortcuts
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="h-px bg-stone-100 mx-1.5" />

          <div className="p-1.5">
            <button
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className={`${rowClass} text-red-600 hover:bg-red-50`}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AvatarMenu;