'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronDown,
  LogIn,
  MoreVertical,
  PanelLeft,
  Pencil,
  Pin,
  Plus,
  Search,
  Share2,
  Trash2,
  X,
} from 'lucide-react';
import { AvatarMenu } from '@/components/dashboard/AvatarMenu';
import { AuthModal, type AuthMode } from './AuthModal';
import type { AvatarModalType } from '@/components/dashboard/AvatarMenu';
import {
  FONT_BODY,
  FONT_HEADING,
  SIDEBAR_BG,
  type HistoryEntry,
  type InputType,
} from './types';

// ── Real logo (put your file in public/) ─────────────────────────────────
const LOGO_SRC = '/logo.png';
const LOGO_ALT = 'Custos AI';

const PIN_ACTIVE_CLASS = 'text-stone-500 fill-stone-500';

const ROW_HOVER = 'hover:bg-[#EBEBEB]';
const ROW_ACTIVE = 'bg-[#E5E5E5]';

// Compact row height (same as the reference): 40px on touch, 36px on desktop.
// Shared by the real rows and the loading skeleton.
const ROW_H = 'h-10 md:h-9';

// Icon used for the "New scan" button (sidebar + collapsed rail).
// Want something different? Swap this one line, e.g. ScanLine, ShieldPlus, SquarePlus.
const NewScanIcon = Plus;

// Shared icon look: thin, clean line icons
const NAV_ICON = 'w-5 h-5 text-stone-700';
const NAV_ICON_STROKE = 1.5;

// How long a freshly-added title keeps its typing animation flag
const FRESH_TITLE_MS = 3500;

// ─────────────────────────────────────────────────────────────────────────
// Small helpers
// ─────────────────────────────────────────────────────────────────────────

function HistorySkeletonRows({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-0.5 py-0.5" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`${ROW_H} px-3 flex items-center rounded-lg`}>
          <div
            className="h-3.5 rounded-md bg-stone-200/80 animate-pulse"
            style={{ width: `${55 + (i % 3) * 15}%` }}
          />
        </div>
      ))}
    </div>
  );
}

function AvatarSkeleton({ expanded = false }: { expanded?: boolean }) {
  if (!expanded) {
    return <div className="w-9 h-9 rounded-full bg-stone-200 animate-pulse" />;
  }
  return (
    <div className="flex items-center gap-2.5 px-1 py-1 w-full">
      <div className="w-9 h-9 rounded-full bg-stone-200 animate-pulse flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="h-2.5 w-24 rounded-md bg-stone-200 animate-pulse" />
        <div className="h-2 w-14 rounded-md bg-stone-200/70 animate-pulse" />
      </div>
    </div>
  );
}

function TypingLabel({ text, animate }: { text: string; animate: boolean }) {
  const [shown, setShown] = useState(animate ? '' : text);

  useEffect(() => {
    if (!animate) {
      setShown(text);
      return;
    }
    setShown('');
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, 22);
    return () => clearInterval(id);
  }, [text, animate]);

  return <span className="truncate">{shown || '\u00A0'}</span>;
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Bolds the part of a title that matches the search query
function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const parts = text.split(new RegExp(`(${escapeRegExp(q)})`, 'ig'));
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <span key={i} className="font-semibold text-stone-900">
            {p}
          </span>
        ) : (
          <React.Fragment key={i}>{p}</React.Fragment>
        )
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Search modal  (↑ ↓ to move, Enter to open, Esc to close)
// ─────────────────────────────────────────────────────────────────────────

function SearchModal({
  open,
  onClose,
  history,
  onSelectHistory,
}: {
  open: boolean;
  onClose: () => void;
  history: HistoryEntry[];
  onSelectHistory: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? history.filter((h) => h.label.toLowerCase().includes(q)) : history;
  }, [history, query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setCursor(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    setCursor(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // keep the highlighted row visible while moving with the arrow keys
  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-idx="${cursor}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [cursor, open]);

  if (!open) return null;

  const choose = (id: string) => {
    onSelectHistory(id);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (filtered.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => (c + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => (c - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = filtered[cursor];
      if (target) choose(target.id);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center pt-[10vh] sm:pt-[12vh] px-3 sm:px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Search scans"
    >
      <div className="absolute inset-0 bg-stone-900/30 backdrop-blur-[1px]" onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-xl bg-white rounded-2xl border border-black/5 shadow-[0_8px_40px_rgba(0,0,0,0.18)] overflow-hidden animate-[scyraFadeIn_0.15s_ease-out]"
        style={{ fontFamily: FONT_BODY }}
      >
        <div className="flex items-center gap-2.5 px-4 sm:px-5 py-3.5 sm:py-4 border-b border-black/5">
          <Search className="w-4 h-4 text-stone-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search scans"
            aria-label="Search scans"
            className="flex-1 min-w-0 bg-transparent outline-none border-none text-[16px] sm:text-[14.5px] text-stone-800 placeholder:text-stone-400"
          />
          <button
            onClick={onClose}
            title="Close"
            aria-label="Close search"
            className="p-1 rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div ref={listRef} className="max-h-[50vh] overflow-y-auto scyra-scroll py-1.5">
          {filtered.length === 0 ? (
            <p className="px-5 py-6 text-center text-[13px] text-stone-400">No results found</p>
          ) : (
            filtered.map((h, i) => (
              <button
                key={h.id}
                data-idx={i}
                onClick={() => choose(h.id)}
                onMouseMove={() => setCursor(i)}
                className={`w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-2.5 text-left transition-colors ${
                  i === cursor ? 'bg-stone-100' : ''
                }`}
              >
                <span className="flex items-center gap-2 min-w-0 text-[14px] text-stone-700">
                  {h.pinned && <Pin className={`w-3 h-3 flex-shrink-0 ${PIN_ACTIVE_CLASS}`} />}
                  <span className="truncate">
                    <Highlight text={h.label} query={query} />
                  </span>
                </span>
                <span className="text-[11.5px] text-stone-400 flex-shrink-0">{h.timestamp}</span>
              </button>
            ))
          )}
        </div>

        <div className="hidden sm:flex items-center gap-4 px-5 py-2 border-t border-black/5 text-[11.5px] text-stone-400">
          <span>↑ ↓ to move</span>
          <span>Enter to open</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Per-row ⋮ menu (hidden until row hover on desktop, always visible on touch)
// ─────────────────────────────────────────────────────────────────────────

function HistoryItemMenu({
  onShare,
  onPin,
  onRename,
  onDelete,
  pinned,
}: {
  onShare: () => void;
  onPin: () => void;
  onRename: () => void;
  onDelete: () => void;
  pinned: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setOpenUp(rect.top > window.innerHeight / 2);
    }
    setOpen((o) => !o);
  };

  const itemCls =
    'w-full flex items-center gap-2.5 px-3.5 py-2.5 md:py-2 text-[13.5px] text-stone-700 hover:bg-stone-100 transition-colors';

  return (
    <div className="relative" ref={ref}>
      <button
        ref={btnRef}
        onClick={handleToggle}
        title="More options"
        aria-label="More options"
        aria-haspopup="menu"
        aria-expanded={open}
        className={`p-1.5 rounded-md transition-all flex-shrink-0 focus-visible:opacity-100 ${
          open
            ? 'opacity-100 bg-stone-300/60 text-stone-800'
            : 'md:opacity-0 md:group-hover:opacity-100 text-stone-400 hover:bg-stone-300/50 hover:text-stone-700'
        }`}
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div
          role="menu"
          className={`absolute right-0 w-44 bg-white rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.14)] border border-black/5 py-1.5 z-30 ${
            openUp ? 'bottom-full mb-1' : 'top-full mt-1'
          }`}
        >
          <button role="menuitem" onClick={(e) => { e.stopPropagation(); onShare(); setOpen(false); }} className={itemCls}>
            <Share2 className="w-4 h-4 text-stone-500" strokeWidth={1.6} /> Share
          </button>
          <button role="menuitem" onClick={(e) => { e.stopPropagation(); onPin(); setOpen(false); }} className={itemCls}>
            <Pin className={`w-4 h-4 ${pinned ? PIN_ACTIVE_CLASS : 'text-stone-500'}`} strokeWidth={1.6} />
            {pinned ? 'Unpin' : 'Pin'}
          </button>
          <button role="menuitem" onClick={(e) => { e.stopPropagation(); onRename(); setOpen(false); }} className={itemCls}>
            <Pencil className="w-4 h-4 text-stone-500" strokeWidth={1.6} /> Rename
          </button>
          <div className="my-1 h-px bg-black/5" />
          <button
            role="menuitem"
            onClick={(e) => { e.stopPropagation(); onDelete(); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 md:py-2 text-[13.5px] text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" strokeWidth={1.6} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Collapsed icon rail
// ─────────────────────────────────────────────────────────────────────────

function RailButton({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`w-10 h-10 flex items-center justify-center rounded-lg text-stone-600 ${ROW_HOVER} hover:text-stone-900 transition-colors`}
    >
      {children}
    </button>
  );
}

function IconRail({ onExpand, onNewScan, onSearch, user, userLoading, onLogout, onOpenModal, onOpenAuth }: any) {
  const isGuest = !userLoading && !user;
  return (
    <div className={`w-[60px] xl:w-[64px] flex-shrink-0 ${SIDEBAR_BG} border-r border-black/5 flex flex-col items-center py-3 xl:py-4 gap-1 transition-all duration-300 ease-in-out h-full`}>
      {/* Real logo → click to expand sidebar */}
      <button
        onClick={onExpand}
        title="Expand sidebar"
        aria-label="Expand sidebar"
        className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-stone-200/60 transition-colors flex-shrink-0"
      >
        <img
          src={LOGO_SRC}
          alt={LOGO_ALT}
          className="w-8 h-8 object-contain select-none pointer-events-none"
          draggable={false}
        />
      </button>
      <div className="h-2 xl:h-3" />
      <RailButton title="New scan" onClick={onNewScan}>
        <NewScanIcon className="w-5 h-5" strokeWidth={NAV_ICON_STROKE} />
      </RailButton>
      {!isGuest && (
        <RailButton title="Search scans" onClick={onSearch}>
          <Search className="w-5 h-5" strokeWidth={NAV_ICON_STROKE} />
        </RailButton>
      )}
      <div className="mt-auto flex flex-col items-center gap-1 pb-2">
        {userLoading ? (
          <AvatarSkeleton />
        ) : isGuest ? (
          <RailButton title="Log in" onClick={() => onOpenAuth('login')}>
            <LogIn className="w-5 h-5" strokeWidth={NAV_ICON_STROKE} />
          </RailButton>
        ) : (
          <AvatarMenu user={user} onLogout={onLogout} onOpenModal={onOpenModal} />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Expanded sidebar (desktop) / full-screen menu (mobile)
// ─────────────────────────────────────────────────────────────────────────

function SidebarContents({
  onToggle,
  onNewScan,
  onSearch,
  user,
  userLoading,
  onLogout,
  onOpenModal,
  history,
  historyLoading,
  activeId,
  onSelectHistory,
  onHistoryShare,
  onHistoryPin,
  onHistoryRename,
  onHistoryDelete,
  onOpenAuth,
  showCollapse = true,
}: any) {
  const router = useRouter();
  const isGuest = !userLoading && !user;
  const [editingHistoryId, setEditingHistoryId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const editingOriginalRef = useRef('');

  const seenIdsRef = useRef<Set<string>>(new Set());
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());

  // Newly added scans get the typing animation once, then the flag is cleared
  useEffect(() => {
    if (historyLoading) return;
    const seen = seenIdsRef.current;
    const newlyAdded: string[] = [];
    for (const h of history as HistoryEntry[]) {
      if (!seen.has(h.id)) newlyAdded.push(h.id);
    }
    if (newlyAdded.length === 0) return;

    const isInitialLoad = seen.size === 0;
    newlyAdded.forEach((id) => seen.add(id));
    if (isInitialLoad) return;

    setFreshIds((prev) => {
      const next = new Set(prev);
      newlyAdded.forEach((id) => next.add(id));
      return next;
    });
    setTimeout(() => {
      setFreshIds((prev) => {
        const next = new Set(prev);
        newlyAdded.forEach((id) => next.delete(id));
        return next;
      });
    }, FRESH_TITLE_MS);
  }, [history, historyLoading]);

  const commitRename = () => {
    const trimmed = editingValue.trim();
    if (editingHistoryId && trimmed && trimmed !== editingOriginalRef.current) {
      onHistoryRename(editingHistoryId, trimmed);
    }
    setEditingHistoryId(null);
  };

  const pinnedItems = (history as HistoryEntry[]).filter((h) => h.pinned);
  const recentItems = (history as HistoryEntry[]).filter((h) => !h.pinned);

  const renderRow = (h: HistoryEntry) => {
    const isActive = activeId === h.id;
    return (
      <div
        key={h.id}
        className={`group w-full flex items-center gap-1 pl-3 pr-1.5 ${ROW_H} rounded-lg transition-colors ${
          isActive ? ROW_ACTIVE : ROW_HOVER
        }`}
      >
        {editingHistoryId === h.id ? (
          <input
            autoFocus
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            onFocus={(e) => e.currentTarget.select()}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename();
              if (e.key === 'Escape') setEditingHistoryId(null);
            }}
            aria-label="Rename scan"
            className="flex-1 min-w-0 text-[16px] text-stone-800 bg-white rounded-lg px-2.5 py-1 outline-none border border-stone-200 focus:border-stone-400"
          />
        ) : (
          <button
            onClick={() => onSelectHistory(h.id)}
            title={h.label}
            aria-current={isActive ? 'page' : undefined}
            className="flex-1 min-w-0 text-left h-full flex items-center"
          >
            <span className="text-[14.5px] leading-none text-stone-800 min-w-0 flex items-center gap-1.5">
              {h.pinned && <Pin className={`w-3 h-3 flex-shrink-0 ${PIN_ACTIVE_CLASS}`} />}
              <TypingLabel text={h.label} animate={freshIds.has(h.id)} />
            </span>
          </button>
        )}
        {editingHistoryId !== h.id && (
          <HistoryItemMenu
            pinned={!!h.pinned}
            onShare={() => onHistoryShare(h.id)}
            onPin={() => onHistoryPin(h.id)}
            onRename={() => {
              editingOriginalRef.current = h.label;
              setEditingHistoryId(h.id);
              setEditingValue(h.label);
            }}
            onDelete={() => onHistoryDelete(h.id)}
          />
        )}
      </div>
    );
  };

  // Nav buttons: 15px regular text + thin 20px icon, compact row
  const navBtn = `w-full flex items-center gap-3 px-3 ${ROW_H} rounded-lg text-[15px] font-normal text-stone-800 ${ROW_HOVER} transition-colors`;
  const sectionLabel = 'px-3 pt-5 pb-1.5 text-[13px] font-normal text-stone-500';

  return (
    <aside
      className={`w-full md:w-[270px] xl:w-[280px] flex-shrink-0 ${SIDEBAR_BG} border-r border-black/5 flex flex-col h-full transition-all duration-300 ease-in-out`}
      style={{ fontFamily: FONT_BODY }}
    >
      {/* Brand + collapse */}
      <div className="pl-3.5 pr-2 pt-[max(1rem,env(safe-area-inset-top))] pb-2.5 flex items-center justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={LOGO_SRC}
            alt={LOGO_ALT}
            className="w-8 h-8 object-contain flex-shrink-0 select-none pointer-events-none"
            draggable={false}
          />
          <span
            className="font-semibold text-stone-800 text-[20px] tracking-tight truncate"
            style={{ fontFamily: FONT_HEADING }}
          >
            Custos AI
          </span>
        </div>
        <button
          onClick={onToggle}
          title={showCollapse ? 'Close sidebar' : 'Close menu'}
          aria-label={showCollapse ? 'Close sidebar' : 'Close menu'}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-stone-500 hover:bg-[#EBEBEB] hover:text-stone-800 transition-colors flex-shrink-0"
        >
          {showCollapse ? (
            <PanelLeft className="w-5 h-5" strokeWidth={NAV_ICON_STROKE} />
          ) : (
            <X className="w-5 h-5" strokeWidth={NAV_ICON_STROKE} />
          )}
        </button>
      </div>

      {/* Fixed nav */}
      <nav className="px-2 space-y-0.5 flex-shrink-0">
        <button onClick={onNewScan} className={navBtn}>
          <NewScanIcon className={NAV_ICON} strokeWidth={NAV_ICON_STROKE} />
          New scan
        </button>
        {isGuest ? (
          <>
            <button onClick={() => router.push('/terms')} className={navBtn}>
              Terms
            </button>
            <button onClick={() => router.push('/privacy')} className={navBtn}>
              Privacy
            </button>
          </>
        ) : (
          <button onClick={onSearch} className={navBtn}>
            <Search className={NAV_ICON} strokeWidth={NAV_ICON_STROKE} />
            <span className="flex-1 text-left">Search scans</span>
            <kbd className="hidden md:inline text-[11px] text-stone-400 font-sans">Ctrl K</kbd>
          </button>
        )}
      </nav>

      {/* Scroll region */}
      <div className="flex-1 min-h-0 overflow-y-auto scyra-scroll px-2 pb-3">
        {isGuest ? null : historyLoading ? (
          <>
            <p className={sectionLabel}>Recent</p>
            <HistorySkeletonRows />
          </>
        ) : history.length === 0 ? (
          <>
            <p className={sectionLabel}>Recent</p>
            <p className="px-3 py-2 text-[14px] text-stone-400">No scans yet</p>
          </>
        ) : (
          <>
            {pinnedItems.length > 0 && (
              <>
                <p className={sectionLabel}>Pinned</p>
                <div className="space-y-0.5">{pinnedItems.map(renderRow)}</div>
              </>
            )}
            {recentItems.length > 0 && (
              <>
                <button
                  onClick={() => router.push('/dashboard?tab=history')}
                  className={`${sectionLabel} flex items-center gap-1 text-left hover:text-stone-700 transition-colors`}
                >
                  Recent
                  <ChevronDown className="w-3.5 h-3.5" strokeWidth={1.8} />
                </button>
                <div className="space-y-0.5">{recentItems.map(renderRow)}</div>
              </>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-black/5 flex-shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {userLoading ? (
          <AvatarSkeleton expanded />
        ) : isGuest ? (
          <div className="flex flex-col gap-2.5 px-0.5">
            <p className="px-1 text-[14px] leading-relaxed text-stone-500">
              Log in to save your scans and chat history.
            </p>
            <button
              onClick={() => onOpenAuth('login')}
              className="w-full h-10 rounded-lg border border-stone-300 text-[14px] font-medium text-stone-800 hover:bg-[#EBEBEB] transition-colors"
            >
              Log in
            </button>
            <button
              onClick={() => onOpenAuth('signup')}
              className="w-full h-10 rounded-lg bg-stone-900 text-[14px] font-medium text-white hover:bg-stone-700 transition-colors"
            >
              Sign up
            </button>
          </div>
        ) : (
          <AvatarMenu user={user} onLogout={onLogout} onOpenModal={onOpenModal} expanded />
        )}
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Public component
// ─────────────────────────────────────────────────────────────────────────

export interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onNewScan: () => void;
  onSelectType: (type: InputType) => void;
  user: any;
  userLoading?: boolean;
  onLogout: () => void;
  onOpenModal: (type: AvatarModalType) => void;
  history: HistoryEntry[];
  historyLoading?: boolean;
  activeId?: string | null;
  onSelectHistory: (id: string) => void;
  onHistoryShare: (id: string) => void;
  onHistoryPin: (id: string) => void;
  onHistoryRename: (id: string, label: string) => void;
  onHistoryDelete: (id: string) => void;
  onHistoryViewDocument: (id: string) => void;
  onHistoryViewPresentation: (id: string) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenPanelFullScreen: () => void;
}

export function Sidebar({
  collapsed,
  onToggle,
  onNewScan,
  user,
  userLoading = false,
  onLogout,
  onOpenModal,
  history,
  historyLoading = false,
  activeId = null,
  onSelectHistory,
  onHistoryShare,
  onHistoryPin,
  onHistoryRename,
  onHistoryDelete,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [lastAuthMode, setLastAuthMode] = useState<AuthMode>('login');

  const openAuth = (m: AuthMode) => {
    setLastAuthMode(m);
    setAuthMode(m);
  };
  const changeAuthMode = (m: AuthMode) => {
    setLastAuthMode(m);
    setAuthMode(m);
  };

  // Ctrl/Cmd + K opens search (logged-in users only)
  useEffect(() => {
    if (!user) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [user]);

  // Mobile menu: lock page scroll + close with Escape
  useEffect(() => {
    if (!mobileOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !searchOpen) onCloseMobile();
    };
    window.addEventListener('keydown', handler);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handler);
    };
  }, [mobileOpen, searchOpen, onCloseMobile]);

  return (
    <>
      <div className="hidden md:block h-full">
        {collapsed ? (
          <IconRail
            onExpand={onToggle}
            onNewScan={onNewScan}
            onSearch={() => setSearchOpen(true)}
            user={user}
            userLoading={userLoading}
            onLogout={onLogout}
            onOpenModal={onOpenModal}
            onOpenAuth={openAuth}
          />
        ) : (
          <SidebarContents
            onToggle={onToggle}
            onNewScan={onNewScan}
            onSearch={() => setSearchOpen(true)}
            user={user}
            userLoading={userLoading}
            onLogout={onLogout}
            onOpenModal={onOpenModal}
            history={history}
            historyLoading={historyLoading}
            activeId={activeId}
            onSelectHistory={onSelectHistory}
            onHistoryShare={onHistoryShare}
            onHistoryPin={onHistoryPin}
            onHistoryRename={onHistoryRename}
            onHistoryDelete={onHistoryDelete}
            onOpenAuth={openAuth}
            showCollapse
          />
        )}
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="relative z-10 h-[100dvh] w-full animate-[scyraSlideIn_0.2s_ease-out]">
            <SidebarContents
              onToggle={onCloseMobile}
              onNewScan={() => {
                onNewScan();
                onCloseMobile();
              }}
              onSearch={() => setSearchOpen(true)}
              user={user}
              userLoading={userLoading}
              onLogout={onLogout}
              onOpenModal={(type: AvatarModalType) => {
                onOpenModal(type);
                onCloseMobile();
              }}
              history={history}
              historyLoading={historyLoading}
              activeId={activeId}
              onSelectHistory={(id: string) => {
                onSelectHistory(id);
                onCloseMobile();
              }}
              onHistoryShare={onHistoryShare}
              onHistoryPin={onHistoryPin}
              onHistoryRename={onHistoryRename}
              onHistoryDelete={onHistoryDelete}
              onOpenAuth={(m: AuthMode) => {
                openAuth(m);
                onCloseMobile();
              }}
              showCollapse={false}
            />
          </div>
        </div>
      )}

      <SearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        history={history}
        onSelectHistory={(id) => {
          onSelectHistory(id);
          onCloseMobile();
        }}
      />

      <AuthModal
        open={authMode !== null}
        mode={authMode ?? lastAuthMode}
        onModeChange={changeAuthMode}
        onClose={() => setAuthMode(null)}
      />
    </>
  );
}

export default Sidebar;