'use client';

import {
  Activity, Search, Sun, Moon, Radio, PenLine, Mail, Users, LogOut,
  Bell, Eye, EyeOff, Check, CheckCheck,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboard } from '@/store';
import { useSmartPoll } from '@/hooks/use-smart-poll';
import { timeAgo } from '@/lib/utils';
import type { Notification } from '@/types';

interface HeaderStats {
  posts_today: number;
  emails_sent: number;
  pipeline_count: number;
}

export function HeaderBar() {
  const { feedOpen, toggleFeed, realOnly, toggleRealOnly } = useDashboard();

  // Lightweight poll for header stats
  const { data: stats } = useSmartPoll<HeaderStats>(
    () => fetch('/api/overview').then(r => r.json()).then(d => d.stats),
    { interval: 60_000 },
  );

  return (
    <header className="fixed top-0 left-0 right-0 h-[var(--header-height)] glass-strong flex items-center justify-between px-4 sm:px-6 z-50">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
          <span className="text-primary font-bold text-sm">H</span>
        </div>
        <span className="font-semibold text-sm tracking-tight">Hermes</span>

        {/* Quick stats — hidden on small screens */}
        {stats && (
          <div className="hidden md:flex items-center gap-3 ml-3 pl-3 border-l border-border/30">
            <QuickStat icon={PenLine} value={stats.posts_today} label="posts" />
            <QuickStat icon={Mail} value={stats.emails_sent} label="sent" />
            <QuickStat icon={Users} value={stats.pipeline_count} label="pipeline" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <SeedToggle active={realOnly} onToggle={toggleRealOnly} />
        <SearchTrigger />
        <NotificationBell />
        <ThemeToggle />
        <FeedToggle open={feedOpen} onToggle={toggleFeed} />
        <SyncStatus />
        <LogoutButton />
      </div>
    </header>
  );
}

function QuickStat({ icon: Icon, value, label }: { icon: typeof PenLine; value: number; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Icon size={12} />
      <span className="font-mono font-medium text-foreground">{value}</span>
      <span>{label}</span>
    </div>
  );
}

function SeedToggle({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        active
          ? 'bg-success/15 text-success border border-success/30'
          : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-border/30'
      }`}
      onClick={onToggle}
      title={active ? 'Showing real data only' : 'Showing all data (including seeded)'}
    >
      {active ? <Eye size={13} /> : <EyeOff size={13} />}
      <span className="hidden sm:inline">{active ? 'Real' : 'All'}</span>
    </button>
  );
}

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: notifications, refetch } = useSmartPoll<Notification[]>(
    () => fetch('/api/notifications?limit=20').then(r => r.json()),
    { interval: 30_000 },
  );

  const unreadCount = notifications?.filter(n => !n.read).length ?? 0;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  async function markRead(id: number) {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    refetch();
  }

  async function markAllRead() {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mark_all_read: true }),
    });
    refetch();
  }

  const SEVERITY_COLORS = {
    info: 'text-primary',
    warning: 'text-warning',
    error: 'text-destructive',
  };

  return (
    <div className="relative" ref={ref}>
      <button
        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors relative ${
          open ? 'bg-primary/15 text-primary' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
        }`}
        onClick={() => setOpen(!open)}
        title="Notifications"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 card border shadow-lg max-h-96 overflow-hidden flex flex-col animate-slide-in z-50">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30">
            <span className="text-sm font-medium">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-[10px] text-primary hover:underline"
              >
                <CheckCheck size={12} /> Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {(!notifications || notifications.length === 0) ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                <Bell size={24} className="mx-auto mb-2 opacity-30" />
                No notifications yet
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-border/20 hover:bg-muted/30 transition-colors ${
                    !n.read ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className={`mt-0.5 ${SEVERITY_COLORS[n.severity] || 'text-muted-foreground'}`}>
                      <Bell size={12} />
                    </div>
                    <div className="flex-1 min-w-0">
                      {n.title && (
                        <div className="text-xs font-medium truncate">{n.title}</div>
                      )}
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{n.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted-foreground">{timeAgo(n.created_at)}</span>
                        {!n.read && (
                          <button
                            onClick={() => markRead(n.id)}
                            className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                          >
                            <Check size={10} /> Read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SearchTrigger() {
  return (
    <button
      className="flex items-center gap-2 bg-muted/50 hover:bg-muted border border-border/30 rounded-lg px-3 py-1.5 text-xs text-muted-foreground transition-colors"
      onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
    >
      <Search size={13} />
      <span className="hidden sm:inline">Search</span>
      <kbd className="hidden sm:inline text-[10px] bg-muted px-1 py-0.5 rounded ml-1">⌘K</kbd>
    </button>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="w-8 h-8" />;

  return (
    <button
      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

function FeedToggle({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button
      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
        open
          ? 'bg-primary/15 text-primary'
          : 'hover:bg-muted text-muted-foreground hover:text-foreground'
      }`}
      onClick={onToggle}
      title="Toggle live feed"
    >
      <Radio size={16} />
    </button>
  );
}

function SyncStatus() {
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    const update = () => setLastSync(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    update();
    const timer = setInterval(update, 30_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <div className="w-2 h-2 rounded-full bg-success pulse-dot" />
      <Activity size={14} />
      <span className="hidden sm:inline font-mono">{lastSync}</span>
    </div>
  );
}

function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <button
      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
      onClick={handleLogout}
      disabled={loading}
      title="Sign out"
    >
      <LogOut size={15} />
    </button>
  );
}
