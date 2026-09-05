import { createFileRoute, redirect } from '@tanstack/react-router';
import { Suspense } from 'react';

const Dashboard = lazy(() =>
  import('../views/Dashboard').then((module) => ({
    default: module.Dashboard,
  })),
);

export const Route = createFileRoute('/dashboard')({
  component: (
    <Suspense fallback={<div>Loading Dashboard…</div>}>
      <Dashboard />
    </Suspense>
  ),
});