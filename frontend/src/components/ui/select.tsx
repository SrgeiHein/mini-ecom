'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

export interface SelectOption<T extends string | number> {
  value: T;
  label: string;
}

interface SelectProps<T extends string | number> {
  value: T;
  options: readonly SelectOption<T>[];
  onChange: (next: T) => void;
  ariaLabel?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function Select<T extends string | number>({
  value,
  options,
  onChange,
  ariaLabel,
  className,
  size = 'md',
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(() =>
    Math.max(
      0,
      options.findIndex((o) => o.value === value),
    ),
  );
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const current = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const commit = (next: T) => {
    onChange(next);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (!open && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (open && e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % options.length);
    }
    if (open && e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + options.length) % options.length);
    }
    if (open && e.key === 'Enter') {
      e.preventDefault();
      const opt = options[activeIndex];
      if (opt) commit(opt.value);
    }
  };

  const sizeClass =
    size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-3.5 py-2.5 text-sm';

  return (
    <div ref={wrapperRef} className={cn('relative', className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        className={cn(
          'inline-flex w-full items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white text-zinc-800 shadow-sm transition hover:border-zinc-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20',
          sizeClass,
        )}
      >
        <span className="truncate">{current?.label ?? 'Select…'}</span>
        <svg
          aria-hidden="true"
          className={cn(
            'h-4 w-4 text-zinc-500 transition',
            open && 'rotate-180',
          )}
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
        >
          <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <ul
          id={listboxId}
          role="listbox"
          tabIndex={-1}
          className="absolute right-0 z-30 mt-1.5 max-h-64 min-w-full overflow-auto rounded-lg border border-zinc-200 bg-white py-1 text-sm shadow-lg ring-1 ring-black/5"
        >
          {options.map((opt, i) => {
            const selected = opt.value === value;
            const active = i === activeIndex;
            return (
              <li
                key={String(opt.value)}
                role="option"
                aria-selected={selected}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => commit(opt.value)}
                className={cn(
                  'flex cursor-pointer items-center justify-between gap-2 px-3 py-2',
                  active && 'bg-indigo-50 text-indigo-700',
                  !active && selected && 'text-indigo-700',
                  !active && !selected && 'text-zinc-700',
                )}
              >
                <span className="truncate">{opt.label}</span>
                {selected && (
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4 text-indigo-600"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      d="m4 10 4 4 8-8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
