import { useSyncExternalStore } from 'react';

import type { LogEntryData, LogLevel } from '@tahti-player/ui';

export const CLIENT_LOG_LIMIT = 1000;

let entries: LogEntryData[] = [];
let nextId = 0;
const listeners = new Set<() => void>();
let notifyScheduled = false;

// Deferred because console.error is often called by React mid-render;
// notifying subscribers synchronously there would schedule a render-phase
// update, whose own warning would be captured again.
function emit() {
  if (notifyScheduled) {
    return;
  }
  notifyScheduled = true;
  queueMicrotask(() => {
    notifyScheduled = false;
    for (const listener of listeners) {
      listener();
    }
  });
}

function formatArg(arg: unknown): string {
  if (typeof arg === 'string') {
    return arg;
  }
  if (arg instanceof Error) {
    return arg.stack ?? `${arg.name}: ${arg.message}`;
  }
  try {
    return JSON.stringify(arg) ?? String(arg);
  } catch {
    return String(arg);
  }
}

export function formatLogArgs(args: readonly unknown[]): string {
  return args.map(formatArg).join(' ');
}

/** Append an in-memory entry shown in Settings → Logs. */
export function logClientEvent(
  level: LogLevel,
  scope: string,
  message: string,
): void {
  nextId += 1;
  const entry: LogEntryData = {
    id: `client-${nextId}`,
    timestamp: new Date(),
    level,
    target: 'tahti-web',
    source: { type: 'core', scope },
    message,
  };
  entries =
    entries.length >= CLIENT_LOG_LIMIT
      ? [...entries.slice(entries.length - CLIENT_LOG_LIMIT + 1), entry]
      : [...entries, entry];
  emit();
}

export function getClientLogs(): LogEntryData[] {
  return entries;
}

export function clearClientLogs(): void {
  entries = [];
  emit();
}

export function subscribeClientLogs(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useClientLogs(): LogEntryData[] {
  return useSyncExternalStore(
    subscribeClientLogs,
    getClientLogs,
    getClientLogs,
  );
}

export function clientLogScopes(logs: readonly LogEntryData[]): string[] {
  return [...new Set(logs.map((log) => log.source.scope))].sort();
}

export function serializeClientLogs(logs: readonly LogEntryData[]): string {
  return logs
    .map(
      (log) =>
        `${log.timestamp.toISOString()} ${log.level.toUpperCase()} [${log.source.scope}] ${log.message}`,
    )
    .join('\n');
}

let uninstallCapture: (() => void) | null = null;

/** Mirrors console warn/error and uncaught errors into the buffer. Idempotent. */
export function installClientLogCapture(): () => void {
  if (uninstallCapture) {
    return uninstallCapture;
  }
  const originalWarn = console.warn;
  const originalError = console.error;
  console.warn = (...args: unknown[]) => {
    logClientEvent('warn', 'console', formatLogArgs(args));
    originalWarn.apply(console, args);
  };
  console.error = (...args: unknown[]) => {
    logClientEvent('error', 'console', formatLogArgs(args));
    originalError.apply(console, args);
  };
  const onError = (event: ErrorEvent) => {
    logClientEvent(
      'error',
      'window',
      event.error ? formatArg(event.error) : event.message,
    );
  };
  const onRejection = (event: PromiseRejectionEvent) => {
    logClientEvent(
      'error',
      'window',
      `Unhandled rejection: ${formatArg(event.reason)}`,
    );
  };
  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onRejection);
  uninstallCapture = () => {
    console.warn = originalWarn;
    console.error = originalError;
    window.removeEventListener('error', onError);
    window.removeEventListener('unhandledrejection', onRejection);
    uninstallCapture = null;
  };
  return uninstallCapture;
}
