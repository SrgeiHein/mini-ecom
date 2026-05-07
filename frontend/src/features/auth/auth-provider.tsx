'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { useIdleTimer } from '@/lib/idle-timer';
import * as authApi from './api';
import { useAuthStore } from './store';

const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const clear = useAuthStore((s) => s.clear);
  const accessToken = useAuthStore((s) => s.accessToken);

  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const refreshed = await authApi.refresh();
        if (cancelled) return;
        setAccessToken(refreshed.accessToken);
        const user = await authApi.me();
        if (cancelled) return;
        setSession(refreshed.accessToken, user);
      } catch {
        if (!cancelled) clear();
      } finally {
        if (!cancelled) setBootstrapped(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setSession, setAccessToken, clear]);

  useIdleTimer({
    timeoutMs: IDLE_TIMEOUT_MS,
    activeTickMs: REFRESH_INTERVAL_MS,
    onIdle: async () => {
      try {
        await authApi.logout();
      } finally {
        clear();
        router.replace('/login');
      }
    },
    onActiveTick: async () => {
      if (!accessToken) return;
      try {
        const refreshed = await authApi.refresh();
        setAccessToken(refreshed.accessToken);
      } catch {
        clear();
        router.replace('/login');
      }
    },
  });

  if (!bootstrapped) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-zinc-500">
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}
