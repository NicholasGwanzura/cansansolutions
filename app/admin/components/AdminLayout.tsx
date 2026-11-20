'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import AdminSidebar, { findNavItem, LogoutIcon } from './AdminSidebar';
import CommandPalette from './CommandPalette';
import ErrorBoundary from './ErrorBoundary';
import LoginScreen from './LoginScreen';

interface AdminLayoutProps {
  children: React.ReactNode;
  /**
   * Kept for compatibility with pages that still pass it; sign-out is handled
   * here so every page behaves the same.
   */
  onLogout?: () => void;
}

type AuthState = 'checking' | 'authed' | 'anonymous';

function useAdminSession() {
  const [state, setState] = useState<AuthState>('checking');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/auth', { cache: 'no-store' })
      .then((res) => {
        if (!cancelled) setState(res.ok ? 'authed' : 'anonymous');
      })
      .catch(() => {
        if (!cancelled) setState('anonymous');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const signOut = async () => {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' });
    } catch {
      // best-effort; the cookie expires on its own
    }
    setState('anonymous');
  };

  return { state, signOut };
}

function TopBar({ onMenu, onSignOut }: { onMenu: () => void; onSignOut: () => void }) {
  const pathname = usePathname();
  const current = findNavItem(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-zinc-200/80 bg-white/85 px-4 backdrop-blur supports-[backdrop-filter]:bg-white/70 sm:px-6">
      <button
        type="button"
        onClick={onMenu}
        className="-ml-1 inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-zinc-100 lg:hidden"
        aria-label="Open navigation"
      >
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
        {current ? (
          <>
            <span className="hidden text-zinc-400 sm:inline">{current.section}</span>
            <span aria-hidden className="hidden text-zinc-300 sm:inline">/</span>
            <span className="truncate font-medium text-zinc-900">{current.item.label}</span>
          </>
        ) : (
          <span className="font-medium text-zinc-900">Admin</span>
        )}
      </nav>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('open-admin-search'))}
          className="flex h-9 items-center gap-2 rounded-button border border-zinc-200 bg-white px-2.5 text-sm text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-700 sm:w-56"
          aria-label="Search"
        >
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <span className="hidden sm:inline">Search…</span>
          <kbd className="ml-auto hidden rounded border border-zinc-200 bg-zinc-50 px-1.5 text-[10px] font-medium text-zinc-400 sm:inline">
            ⌘K
          </kbd>
        </button>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden h-9 items-center gap-1.5 rounded-button px-2.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 sm:flex"
        >
          View site
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </a>
        <button
          type="button"
          onClick={onSignOut}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogoutIcon className="h-[17px] w-[17px]" />
        </button>
      </div>
    </header>
  );
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { state, signOut } = useAdminSession();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  if (state === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
      </div>
    );
  }

  if (state === 'anonymous') {
    // Pages fetch their data on mount, before the session is known, so reload
    // after sign-in to fetch it again with the new cookie.
    return <LoginScreen onLogin={() => window.location.reload()} />;
  }

  return (
    <div className="admin-shell min-h-screen bg-zinc-50 text-zinc-900 selection:bg-red-100 selection:text-red-900">
      <AdminSidebar mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />
      <div className="min-w-0 lg:pl-56">
        <TopBar onMenu={() => setMobileNavOpen(true)} onSignOut={signOut} />
        <ErrorBoundary>
          <div className="mx-auto w-full max-w-[1400px]">{children}</div>
        </ErrorBoundary>
      </div>
      <CommandPalette />
    </div>
  );
}
