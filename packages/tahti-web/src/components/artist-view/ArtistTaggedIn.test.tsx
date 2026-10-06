// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import type { PublicMention } from '../../api/mentions';
import { ArtistTaggedIn } from './ArtistProfileSections';

const mentioner = { username: 'aino', displayName: 'Aino' };

async function renderTaggedIn(mentions: PublicMention[]) {
  const router = createRouter({
    routeTree: createRootRoute({
      component: () => <ArtistTaggedIn mentions={mentions} surfaceStyle={{}} />,
    }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
}

describe('ArtistTaggedIn', () => {
  afterEach(cleanup);

  it('links each mention to its source with the right label', async () => {
    await renderTaggedIn([
      {
        id: 'm1',
        surface: 'TRACKLIST',
        createdAt: '2026-09-01T00:00:00.000Z',
        mentioner,
        sourceTitle: 'Aurora Drift',
        sourceUrl: '/t/s1',
      },
      {
        id: 'm2',
        surface: 'CHAT',
        createdAt: '2026-09-02T00:00:00.000Z',
        mentioner,
        sourceTitle: 'Aino',
        sourceUrl: '/chat/aino',
      },
      {
        id: 'm3',
        surface: 'ANNOUNCEMENT',
        createdAt: '2026-09-03T00:00:00.000Z',
        mentioner,
        sourceTitle: 'Aino',
        sourceUrl: '/channel/aino',
      },
    ]);
    expect(
      screen.getByRole('link', { name: 'Aurora Drift' }).getAttribute('href'),
    ).toBe('/t/s1');
    expect(screen.getByText('Tracklist credit · by Aino')).toBeTruthy();
    expect(screen.getByText('Channel chat · by Aino')).toBeTruthy();
    expect(screen.getByText('Channel announcement · by Aino')).toBeTruthy();
  });

  it('falls back to the mentioner when the source is hidden or off-site', async () => {
    await renderTaggedIn([
      {
        id: 'm1',
        surface: 'TRACKLIST',
        createdAt: '2026-09-01T00:00:00.000Z',
        mentioner,
        sourceTitle: null,
        sourceUrl: null,
      },
      {
        id: 'm2',
        surface: 'BIO',
        createdAt: '2026-09-01T00:00:00.000Z',
        mentioner: { username: 'veikko', displayName: 'Veikko' },
        sourceTitle: 'Veikko',
        sourceUrl: '//evil.example/x',
      },
    ]);
    expect(
      screen.getByRole('link', { name: 'Aino' }).getAttribute('href'),
    ).toBe('/u/aino');
    expect(
      screen.getByRole('link', { name: 'Veikko' }).getAttribute('href'),
    ).toBe('/u/veikko');
  });

  it('labels release and newsletter mentions and never shows an email as a name', async () => {
    await renderTaggedIn([
      {
        id: 'm1',
        surface: 'RELEASE',
        createdAt: '2026-09-01T00:00:00.000Z',
        mentioner,
        sourceTitle: 'Northern Lights EP',
        sourceUrl: '/r/northern-lights',
      },
      {
        id: 'm2',
        surface: 'NEWSLETTER',
        createdAt: '2026-09-02T00:00:00.000Z',
        mentioner: { username: 'veikko', displayName: 'veikko@example.fi' },
        sourceTitle: 'veikko@example.fi',
        sourceUrl: '/u/veikko',
      },
    ]);
    expect(
      screen
        .getByRole('link', { name: 'Northern Lights EP' })
        .getAttribute('href'),
    ).toBe('/r/northern-lights');
    expect(screen.getByText('Release notes · by Aino')).toBeTruthy();
    expect(screen.getByText('Newsletter · by veikko')).toBeTruthy();
    expect(
      screen.getByRole('link', { name: 'veikko' }).getAttribute('href'),
    ).toBe('/u/veikko');
    expect(document.body.textContent).not.toContain('@example.fi');
  });
});
