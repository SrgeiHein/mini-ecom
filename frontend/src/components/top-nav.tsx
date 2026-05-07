'use client';

import { useRouter } from 'next/navigation';
import * as authApi from '@/features/auth/api';
import { useAuthStore } from '@/features/auth/store';

export function TopNav() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);

  const onLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      clear();
      router.replace('/login');
    }
  };

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold tracking-tight">
            Mini E-commerce
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {user && (
            <span className="hidden truncate text-zinc-500 sm:inline-block">
              {user.email}
            </span>
          )}
          <button
            type="button"
            onClick={onLogout}
            className="rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium hover:bg-zinc-50"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
