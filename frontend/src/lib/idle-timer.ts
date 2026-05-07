'use client';

import { useEffect, useRef } from 'react';

const ACTIVITY_EVENTS = [
  'mousedown',
  'keydown',
  'scroll',
  'touchstart',
  'visibilitychange',
] as const;

interface UseIdleTimerOptions {
  timeoutMs: number;
  onIdle: () => void;
  /** Optional periodic ping while active (e.g. silent token refresh). */
  onActiveTick?: () => void;
  activeTickMs?: number;
}

export function useIdleTimer({
  timeoutMs,
  onIdle,
  onActiveTick,
  activeTickMs = 5 * 60 * 1000,
}: UseIdleTimerOptions): void {
  const lastActivityRef = useRef<number>(0);
  const lastTickRef = useRef<number>(0);
  const onIdleRef = useRef(onIdle);
  const onTickRef = useRef(onActiveTick);

  useEffect(() => {
    onIdleRef.current = onIdle;
    onTickRef.current = onActiveTick;
  }, [onIdle, onActiveTick]);

  useEffect(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    lastTickRef.current = now;

    const markActive = () => {
      lastActivityRef.current = Date.now();
    };

    for (const ev of ACTIVITY_EVENTS) {
      window.addEventListener(ev, markActive, { passive: true });
    }

    const interval = window.setInterval(() => {
      const tickNow = Date.now();
      const idleFor = tickNow - lastActivityRef.current;
      if (idleFor >= timeoutMs) {
        onIdleRef.current();
        return;
      }
      if (onTickRef.current && tickNow - lastTickRef.current >= activeTickMs) {
        lastTickRef.current = tickNow;
        onTickRef.current();
      }
    }, 30_000);

    return () => {
      for (const ev of ACTIVITY_EVENTS) {
        window.removeEventListener(ev, markActive);
      }
      window.clearInterval(interval);
    };
  }, [timeoutMs, activeTickMs]);
}
