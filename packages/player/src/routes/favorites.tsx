import { createFileRoute, redirect } from '@tanstack/react-router';
import { Suspense } from 'react';

const Favorites = lazy(() =>
  import('../views/Favorites').then((module) => ({
    default: module.Favorites,
  })),
);

export const Route = createFileRoute('/favorites')({
  component: (
    <Suspense fallback={<div>Loading Favorites…</div>}>
      <Favorites />
    </Suspense>
  ),
});