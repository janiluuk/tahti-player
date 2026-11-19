// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { i18n } from '@tahti-player/i18n';

import { WhatIsItView } from './WhatIsItView';

async function renderView() {
  const router = createRouter({
    routeTree: createRootRoute({ component: WhatIsItView }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe('WhatIsItView', () => {
  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage('en_US');
  });

  it('shows who / what / features sections from the org pitch', async () => {
    await renderView();

    expect(
      screen.getByRole('heading', { name: 'What is Tahti', level: 1 }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', {
        name: /Broadcasting for independent artists/,
      }),
    ).toBeVisible();
    expect(screen.getByText('Artists & DJs')).toBeVisible();
    expect(
      screen.getByRole('heading', { name: /One platform instead of five/ }),
    ).toBeVisible();
    expect(screen.getByText('Live & radio')).toBeVisible();
    expect(screen.getByText('Library & releases')).toBeVisible();
    expect(
      screen.getAllByRole('link', { name: 'Join Tahti' })[0],
    ).toBeVisible();
  });
});
