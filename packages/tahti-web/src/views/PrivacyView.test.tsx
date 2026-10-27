// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { PrivacyView } from './PrivacyView';

describe('PrivacyView', () => {
  afterEach(cleanup);

  it('says what listening statistics store and what artists see', async () => {
    const router = createRouter({
      routeTree: createRootRoute({ component: PrivacyView }),
      history: createMemoryHistory({ initialEntries: ['/'] }),
    });
    await act(async () => {
      render(<RouterProvider router={router} />);
    });
    expect(screen.getByText('Listening statistics')).toBeTruthy();
    const body = screen.getByText(/For each listening session we store/);
    expect(body.textContent).toContain(
      'The IP address and the full user agent are not stored',
    );
    expect(body.textContent).toContain('at least five listens');
  });

  it('says where to download your data and what the export holds', async () => {
    const router = createRouter({
      routeTree: createRootRoute({ component: PrivacyView }),
      history: createMemoryHistory({ initialEntries: ['/'] }),
    });
    await act(async () => {
      render(<RouterProvider router={router} />);
    });
    const item = screen.getByText('Portability').closest('li');
    expect(item?.textContent).toContain('Settings → Account → Data export');
    expect(item?.textContent).toContain('releases with their tracks');
    expect(item?.textContent).toContain('your votes');
    expect(item?.textContent).toContain('listening sessions');
    expect(item?.textContent).toContain('venues you run');
    expect(item?.textContent).toContain('restrictions the board');
  });
});
