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

import { ForArtistsView } from './ForArtistsView';

async function renderView() {
  const router = createRouter({
    routeTree: createRootRoute({ component: ForArtistsView }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe('ForArtistsView', () => {
  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage('en_US');
  });

  it('shows the six studio pillars', async () => {
    await renderView();
    for (const title of [
      'Go live',
      'Publish',
      'Program your channel',
      'Design it',
      'Earn',
      'Grow',
    ]) {
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    }
  });

  it('links to sign-up and the artist guide', async () => {
    await renderView();
    const startLinks = screen.getAllByRole('link', {
      name: /start your channel/i,
    });
    expect(startLinks.length).toBeGreaterThan(0);
    for (const link of startLinks) {
      expect(link).toHaveAttribute('href', '/join');
    }
    expect(
      screen.getByRole('link', { name: /read the artist guide/i }),
    ).toHaveAttribute('href', '/help/for-artists');
  });

  it('renders in Finnish when the locale is Finnish', async () => {
    await i18n.changeLanguage('fi_FI');
    await renderView();
    expect(
      screen.getByRole('heading', { name: 'Mene liveen' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Suomi' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });
});
