import { createFileRoute, redirect } from '@tanstack/react-router';
import { Suspense } from 'react';

const Search = lazy(() =>
  import('../views/Search').then((module) => ({
    default: module.Search,
  })),
);

export const Route = createFileRoute('/search')({
  component: (
    <Suspense fallback={<div>Loading Search…</div>}>
      <Search />
    </Suspense>
  ),
});