'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
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
import type { AvatarModalType } from '@/components/dashboard/AvatarMenu';
import {
  FONT_BODY,
  FONT_HEADING,
  SIDEBAR_BG,
  type HistoryEntry,
  type InputType,
} from './types';

// Shared pin styling: black at low opacity instead of blue.
const PIN_ACTIVE_CLASS = 'text-stone-800/40 fill-stone-800/40';

// ─── Skeleton rows shown while history is still loading ───────────────────

function HistorySkeletonRows({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-1 py-0.5" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="px-2.5 py-2 rounded-lg">
          <div
            className="h-3.5 rounded-md bg-stone-200/80 animate-pulse"
            style={{ width: `${62 + (i % 3) * 10}%` }}
          />
          <div className="h-2.5 w-14 rounded-md bg-stone-200/60 animate-pulse mt-1.5" />
        </div>
      ))}
    </div>
  );
}

// NEW — skeleton avatar circle shown while the auth/user fetch is still in
// flight, so the corner doesn't flash empty/blank before settling.
function AvatarSkeleton({ expanded = false }: { expanded?: boolean }) {
  if (!expanded) {
    return <div className="w-8 h-8 rounded-full bg-stone-200 animate-pulse" />;
  }
  return (
    <div className="flex items-center gap-2.5 px-1 py-1 w-full">
      <div className="w-8 h-8 rounded-full bg-stone-200 animate-pulse flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="h-2.5 w-24 rounded-md bg-stone-200 animate-pulse" />
        <div className="h-2 w-14 rounded-md bg-stone-200/70 animate-pulse" />
      </div>
    </div>
  );
}

// ─── Typing effect for a freshly-created history title ────────────────────
// When a scan finishes, its AI-generated title lands in history all at
// once. Instead of just popping in, the newest entry's label types itself
// out character-by-character — every other (already-seen) entry renders
// instantly as plain text, so this never replays on normal re-renders.

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, animate]);

  return <span className="truncate">{shown || '\u00A0'}</span>;
}

// ─── Search modal — "Search chats and projects" style command palette ─────

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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const filtered = query.trim()
    ? history.filter((h) => h.label.toLowerCase().includes(query.trim().toLowerCase()))
    : history;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[12vh] px-4">
      <div className="absolute inset-0 bg-stone-900/30 backdrop-blur-[1px]" onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-xl bg-white rounded-2xl border border-[#e7e4e1] shadow-xl overflow-hidden animate-[scyraFadeIn_0.15s_ease-out]"
        style={{ fontFamily: FONT_BODY }}
      >
        <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-[#e7e4e1]">
          <Search className="w-4 h-4 text-stone-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search scans and reports"
            className="flex-1 min-w-0 bg-transparent outline-none border-none text-[14.5px] text-stone-800 placeholder:text-stone-400"
          />
          <button
            onClick={onClose}
            title="Close"
            className="p-1 rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="max-h-[50vh] overflow-y-auto scyra-scroll py-1.5">
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-center text-[13px] text-stone-400">No results found</p>
          ) : (
            filtered.map((h) => (
              <button
                key={h.id}
                onClick={() => {
                  onSelectHistory(h.id);
                  onClose();
                }}
                className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-stone-100 transition-colors"
              >
                <span className="flex items-center gap-2 min-w-0 text-[13.5px] text-stone-700 font-medium">
                  {h.pinned && <Pin className={`w-3 h-3 flex-shrink-0 ${PIN_ACTIVE_CLASS}`} />}
                  <span className="truncate">{h.label}</span>
                </span>
                <span className="text-[11.5px] text-stone-400 flex-shrink-0">{h.timestamp}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Kebab menu for a single sidebar history row ───────────────────────
// Opens downward when the row sits in the upper half of the viewport,
// and upward when it sits in the lower half, so the menu never gets
// clipped off-screen — this covers both "3-dot near the top of the list"
// (menu drops down) and "3-dot near the bottom" (menu flips up).

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
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      // If the trigger sits below the vertical midpoint of the viewport,
      // there's more room above it than below — open upward. Otherwise
      // (trigger near the top) open downward.
      setOpenUp(rect.top > window.innerHeight / 2);
    }
    setOpen((o) => !o);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        ref={btnRef}
        onClick={handleToggle}
        title="More options"
        className={`p-1 rounded-md transition-colors flex-shrink-0 ${
          open ? 'bg-stone-300/60 text-stone-800' : 'text-stone-400 hover:bg-stone-300/50 hover:text-stone-700'
        }`}
      >
        <MoreVertical className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div
          className={`absolute right-0 w-44 bg-white rounded-lg shadow-lg py-1 z-30 ${
            openUp ? 'bottom-full mb-1' : 'top-full mt-1'
          }`}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare();
              setOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-[12.5px] text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5 text-stone-500" />
            Share
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPin();
              setOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-[12.5px] text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <Pin className={`w-3.5 h-3.5 ${pinned ? PIN_ACTIVE_CLASS : 'text-stone-500'}`} />
            {pinned ? 'Unpin' : 'Pin'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRename();
              setOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-[12.5px] text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5 text-stone-500" />
            Rename
          </button>
          <div className="my-1 h-px bg-[#e7e4e1]" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
              setOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-[12.5px] text-red-600 hover:bg-red-800 hover:text-white transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Collapsed icon rail — just New Scan + Search + avatar ─────────────────

function IconRail({ onExpand, onNewScan, onSearch, user, userLoading, onLogout, onOpenModal }: any) {
  return (
    <div className={`w-14 flex-shrink-0 ${SIDEBAR_BG} flex flex-col items-center py-4 gap-1 transition-all duration-300 ease-in-out h-full border-r border-[#e7e4e1]`}>
      <button
        onClick={onExpand}
        title="Expand sidebar"
        className="w-9 h-9 flex items-center justify-center rounded-lg text-stone-500 hover:bg-stone-200/70 hover:text-stone-800 transition-colors mb-1"
      >
        <PanelLeft className="w-[18px] h-[18px]" />
      </button>
      <button
        onClick={onNewScan}
        title="New Scan"
        className="w-9 h-9 flex items-center justify-center rounded-lg text-stone-500 hover:bg-stone-200/70 hover:text-stone-800 transition-colors"
      >
        <Plus className="w-[18px] h-[18px]" />
      </button>
      <button
        onClick={onSearch}
        title="Search"
        className="w-9 h-9 flex items-center justify-center rounded-lg text-stone-500 hover:bg-stone-200/70 hover:text-stone-800 transition-colors"
      >
        <Search className="w-[18px] h-[18px]" />
      </button>
      <div className="mt-auto flex flex-col items-center gap-1 pb-4">
        {userLoading ? (
          <AvatarSkeleton />
        ) : (
          <AvatarMenu user={user} onLogout={onLogout} onOpenModal={onOpenModal} />
        )}
      </div>
    </div>
  );
}

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
  onSelectHistory,
  onHistoryShare,
  onHistoryPin,
  onHistoryRename,
  onHistoryDelete,
  showCollapse = true,
}: any) {
  const router = useRouter();
  const [editingHistoryId, setEditingHistoryId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');

  // Tracks which history ids we've already rendered once, so only a
  // genuinely NEW entry gets the typing animation — everything already
  // seen (on re-renders, pin/rename, etc.) just shows instantly.
  const seenIdsRef = useRef<Set<string>>(new Set());
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (historyLoading) return;
    const seen = seenIdsRef.current;
    const newlyAdded: string[] = [];
    for (const h of history as HistoryEntry[]) {
      if (!seen.has(h.id)) newlyAdded.push(h.id);
    }
    if (newlyAdded.length > 0) {
      // Skip animating on the very first load (seen set still empty) —
      // only entries added AFTER the initial list was populated should type.
      const isInitialLoad = seen.size === 0;
      newlyAdded.forEach((id) => seen.add(id));
      if (!isInitialLoad) {
        setFreshIds((prev) => {
          const next = new Set(prev);
          newlyAdded.forEach((id) => next.add(id));
          return next;
        });
      }
    }
  }, [history, historyLoading]);

  const commitRename = () => {
    if (editingHistoryId) onHistoryRename(editingHistoryId, editingValue);
    setEditingHistoryId(null);
  };

  return (
    <aside className={`w-64 flex-shrink-0 ${SIDEBAR_BG} flex flex-col h-full transition-all duration-300 ease-in-out border-r border-[#e7e4e1]`} style={{ fontFamily: FONT_BODY }}>
      {/* Fixed header — brand only. Search now lives below "New chat", not here. */}
      <div className="px-3 py-4 flex items-center justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="font-bold text-stone-800 text-[20px] tracking-tight truncate"
            style={{ fontFamily: FONT_HEADING }}
          >
            Custos AI
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {showCollapse ? (
            <button
              onClick={onToggle}
              title="Collapse sidebar"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-500 hover:bg-stone-200/70 hover:text-stone-800 transition-colors"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onToggle}
              title="Close menu"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-500 hover:bg-stone-200/70 hover:text-stone-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Fixed nav — just New chat, then Search right under it. */}
      <nav className="px-2.5 pb-1 space-y-0.5 flex-shrink-0">
        <button
          onClick={onNewScan}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13.5px] font-medium text-stone-600 hover:bg-stone-200/60 hover:text-stone-800 transition-colors"
        >
          <Plus className="w-4 h-4 text-stone-500" />
          New scan
        </button>
        <button
          onClick={onSearch}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13.5px] font-medium text-stone-600 hover:bg-stone-200/60 hover:text-stone-800 transition-colors"
        >
          <Search className="w-4 h-4 text-stone-500" />
          Search
        </button>
      </nav>

      {/* Only this region scrolls */}
      <div className="flex-1 min-h-0 overflow-y-auto scyra-scroll px-2.5">
        <div className="pt-3">
          <button
            onClick={() => router.push('/dashboard?tab=history')}
            className="text-left px-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-stone-400 hover:text-stone-600 transition-colors"
          >
            Recent
          </button>
          <div className="space-y-0.5 pb-3">
            {historyLoading ? (
              <HistorySkeletonRows />
            ) : history.length === 0 ? (
              <p className="px-2.5 py-2 text-[12.5px] text-stone-400">No scans yet</p>
            ) : (
              history.map((h: HistoryEntry) => (
                <div
                  key={h.id}
                  className="group w-full flex items-center gap-1 px-2.5 py-2 rounded-lg hover:bg-stone-200/60 transition-colors"
                >
                  {editingHistoryId === h.id ? (
                    <input
                      autoFocus
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRename();
                        if (e.key === 'Escape') setEditingHistoryId(null);
                      }}
                      className="flex-1 min-w-0 text-[13px] text-stone-700 font-medium bg-white rounded-md px-1.5 py-0.5 outline-none border border-stone-200 focus:border-blue-300"
                    />
                  ) : (
                    <button
                      onClick={() => onSelectHistory(h.id)}
                      className="flex-1 min-w-0 text-left"
                    >
                      {/* h.label is the AI-generated title (e.g. "HBL Security Analysis")
                          when available. A brand-new entry types itself out instead
                          of just appearing — see freshIds/TypingLabel above. */}
                      <div className="text-[13px] text-stone-700 font-medium truncate flex items-center gap-1">
                        {h.pinned && <Pin className={`w-3 h-3 flex-shrink-0 ${PIN_ACTIVE_CLASS}`} />}
                        <TypingLabel text={h.label} animate={freshIds.has(h.id)} />
                      </div>
                      <div className="text-[11px] text-stone-400 mt-0.5">{h.timestamp}</div>
                    </button>
                  )}
                  {editingHistoryId !== h.id && (
                    <HistoryItemMenu
                      pinned={!!h.pinned}
                      onShare={() => onHistoryShare(h.id)}
                      onPin={() => onHistoryPin(h.id)}
                      onRename={() => {
                        setEditingHistoryId(h.id);
                        setEditingValue(h.label);
                      }}
                      onDelete={() => onHistoryDelete(h.id)}
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Fixed footer — avatar, name, plan (handled inside AvatarMenu) */}
      <div className="px-2.5 py-3 border-t border-[#e7e4e1] flex-shrink-0">
        {userLoading ? (
          <AvatarSkeleton expanded />
        ) : (
          <AvatarMenu user={user} onLogout={onLogout} onOpenModal={onOpenModal} expanded />
        )}
      </div>
    </aside>
  );
}

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
  onSelectHistory: (id: string) => void;
  onHistoryShare: (id: string) => void;
  onHistoryPin: (id: string) => void;
  onHistoryRename: (id: string, label: string) => void;
  onHistoryDelete: (id: string) => void;
  onHistoryViewDocument: (id: string) => void;
  onHistoryViewPresentation: (id: string) => void;
  // Mobile: whether the sidebar overlay is open
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
  onSelectHistory,
  onHistoryShare,
  onHistoryPin,
  onHistoryRename,
  onHistoryDelete,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar: full or icon-rail, collapses in place */}
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
            onSelectHistory={onSelectHistory}
            onHistoryShare={onHistoryShare}
            onHistoryPin={onHistoryPin}
            onHistoryRename={onHistoryRename}
            onHistoryDelete={onHistoryDelete}
            showCollapse
          />
        )}
      </div>

      {/* Mobile sidebar: hamburger-triggered overlay drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-stone-900/30 backdrop-blur-[1px]"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 h-full animate-[scyraSlideIn_0.2s_ease-out]">
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
              onOpenModal={onOpenModal}
              history={history}
              historyLoading={historyLoading}
              onSelectHistory={(id: string) => {
                onSelectHistory(id);
                onCloseMobile();
              }}
              onHistoryShare={onHistoryShare}
              onHistoryPin={onHistoryPin}
              onHistoryRename={onHistoryRename}
              onHistoryDelete={onHistoryDelete}
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
    </>
  );
}

export default Sidebar;