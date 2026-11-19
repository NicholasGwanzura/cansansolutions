'use client';

import { useEffect } from 'react';

/**
 * Shared admin UI primitives. Keep these small and dependency-free so every
 * admin page looks and behaves the same.
 */

const ERROR_PATTERN =
  /\b(fail|failed|failure|error|invalid|unable|cannot|can't|could not|couldn't|required|denied|unauthori[sz]ed|forbidden|not found|not configured|not set|too many|too large|missing|exceeds?|timed? ?out|unavailable|unsupported|not allowed|must be|must have)\b/i;

export type NoticeTone = 'success' | 'error';

export function inferNoticeTone(message: string): NoticeTone {
  return ERROR_PATTERN.test(message) ? 'error' : 'success';
}

/**
 * Floating toast for page messages. Sits above drawers and modals so save
 * errors are visible while an editor is open. Success messages auto-dismiss.
 */
export function Notice({
  message,
  onDismiss,
  tone,
}: {
  message: string;
  onDismiss: () => void;
  tone?: NoticeTone;
}) {
  const resolvedTone = tone ?? (message ? inferNoticeTone(message) : 'success');

  useEffect(() => {
    if (!message || resolvedTone === 'error') return;
    const timer = window.setTimeout(onDismiss, 4500);
    return () => window.clearTimeout(timer);
  }, [message, resolvedTone, onDismiss]);

  if (!message) return null;

  const isError = resolvedTone === 'error';
  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[80] flex justify-center px-4 sm:inset-x-auto sm:right-6 sm:bottom-6"
    >
      <div
        className={`pointer-events-auto flex max-w-md items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg shadow-zinc-900/10 ${
          isError
            ? 'border-red-200 bg-white text-red-800'
            : 'border-zinc-200 bg-zinc-900 text-white'
        }`}
      >
        <span
          aria-hidden
          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
            isError ? 'bg-red-600 text-white' : 'bg-emerald-500 text-white'
          }`}
        >
          {isError ? '!' : '✓'}
        </span>
        <p className="min-w-0 flex-1 leading-5">{message}</p>
        <button
          type="button"
          onClick={onDismiss}
          className={`-mr-1 shrink-0 rounded px-1 leading-5 ${isError ? 'text-red-400 hover:text-red-700' : 'text-zinc-400 hover:text-white'}`}
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

/** Standard page title row: title + optional description on the left, actions on the right. */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">{title}</h1>
        {description ? <p className="mt-1 text-sm text-zinc-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
