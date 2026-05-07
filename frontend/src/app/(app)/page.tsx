import { Suspense } from 'react';
import { CatalogContent } from './catalog-content';

export default function CatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="text-sm text-zinc-500">Loading catalog…</div>
      }
    >
      <CatalogContent />
    </Suspense>
  );
}
