// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { i18n } from '@tahti-player/i18n';

import { HelpArticleView, HelpHubView } from './HelpView';

async function renderWith(component: () => React.ReactNode) {
  const router = createRouter({
    routeTree: createRootRoute({ component }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe('HelpView', () => {
  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage('en_US');
  });

  it('lists every guide group on the hub', async () => {
    await renderWith(() => <HelpHubView />);
    expect(
      screen.getByRole('heading', { name: 'Start here' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Artist guide/ })).toHaveAttribute(
      'href',
      '/help/for-artists',
    );
  });

  it('filters guides by search', async () => {
    await renderWith(() => <HelpHubView />);
    await userEvent.type(
      screen.getByRole('searchbox', { name: 'Search help guides' }),
      'Soulseek',
    );
    expect(
      screen.getByRole('link', { name: /Local files and Soulseek/ }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Artist guide/ })).toBeNull();
  });

  it('switches an article to Finnish from the language toggle', async () => {
    await renderWith(() => <HelpArticleView slug="for-artists" />);
    expect(
      screen.getByRole('heading', { name: 'Artist gallery' }),
    ).toBeInTheDocument();
    await act(async () => {
      await userEvent.click(screen.getByRole('radio', { name: 'Suomi' }));
    });
    expect(
      await screen.findByRole('heading', { name: 'Artistigalleria' }),
    ).toBeInTheDocument();
  });
});
