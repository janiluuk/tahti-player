// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { StudioRelease } from '../../../api/studio-types';
import { ReleaseOpsPanel } from './ReleaseOpsPanel';

const { fetchReleaseCatalog, fetchRevelatorBilling } = vi.hoisted(() => ({
  fetchReleaseCatalog: vi.fn(),
  fetchRevelatorBilling: vi.fn(),
}));

vi.mock('../../../api/distribution', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../api/distribution')>()),
  fetchReleaseCatalog,
  fetchRevelatorBilling,
  fetchDistributionStatus: vi.fn(async () => ({
    data: [],
    meta: { source: 'api' as const },
  })),
}));

const release = {
  id: 'r1',
  title: 'Night Drive',
  type: 'SINGLE',
  state: 'DRAFT',
  smartLinkSlug: 'night-drive',
  tracks: [],
} as unknown as StudioRelease;

async function renderPanel() {
  const router = createRouter({
    routeTree: createRootRoute({
      component: () => <ReleaseOpsPanel release={release} />,
    }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ReleaseOpsPanel load errors', () => {
  it('shows an inline PageError when the catalog fails', async () => {
    fetchReleaseCatalog.mockResolvedValue({
      data: null,
      meta: { source: 'api', reason: 'HTTP 500' },
    });
    fetchRevelatorBilling.mockResolvedValue({
      data: null,
      meta: { source: 'api' },
    });
    await renderPanel();
    fireEvent.click(await screen.findByRole('button', { name: /Release ops/ }));
    expect(
      await screen.findByText('Could not load the catalog'),
    ).toBeInTheDocument();
    expect(screen.getByText('HTTP 500')).toBeInTheDocument();
  });
});
