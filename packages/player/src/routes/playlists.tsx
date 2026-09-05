import { createFileRoute, redirect } from '@tanstack/react-router';
import { Suspense } from 'react';

const Playlists = lazy(() =>
  import('../views/playlists').then((module) => ({
    default: module.Playlists,
  })),
);

export const Route = createFileRoute('/playlists')({
  component: (
    <Suspense fallback={<div>Loading Playlists…</div>}>
      <Playlists />
    </Suspense>
  ),
});