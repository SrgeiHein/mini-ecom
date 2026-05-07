import type { Product } from './types';

const PALETTE = [
  { bg: 'bg-rose-100', text: 'text-rose-700', ring: 'ring-rose-200', dot: 'bg-rose-500' },
  { bg: 'bg-amber-100', text: 'text-amber-700', ring: 'ring-amber-200', dot: 'bg-amber-500' },
  { bg: 'bg-emerald-100', text: 'text-emerald-700', ring: 'ring-emerald-200', dot: 'bg-emerald-500' },
  { bg: 'bg-sky-100', text: 'text-sky-700', ring: 'ring-sky-200', dot: 'bg-sky-500' },
  { bg: 'bg-violet-100', text: 'text-violet-700', ring: 'ring-violet-200', dot: 'bg-violet-500' },
  { bg: 'bg-fuchsia-100', text: 'text-fuchsia-700', ring: 'ring-fuchsia-200', dot: 'bg-fuchsia-500' },
  { bg: 'bg-teal-100', text: 'text-teal-700', ring: 'ring-teal-200', dot: 'bg-teal-500' },
  { bg: 'bg-orange-100', text: 'text-orange-700', ring: 'ring-orange-200', dot: 'bg-orange-500' },
] as const;

export type CategoryColor = (typeof PALETTE)[number];

export const getCategory = (product: Pick<Product, 'name'>): string => {
  const split = product.name.split(' Model ');
  return split.length > 1 ? split[0] : product.name.split(' ')[0];
};

export const getCategoryColor = (category: string): CategoryColor => {
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = (hash * 31 + category.charCodeAt(i)) | 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
};
