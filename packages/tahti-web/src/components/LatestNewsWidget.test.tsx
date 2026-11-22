// @vitest-environment jsdom
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as adminApi from '../api/admin';
import { fetchAnnouncements } from '../api/client';
import { fetchRssArticles } from '../api/rss-feed';
import type { Announcement, AuthUser } from '../api/types';
import { useAuthStore } from '../stores/authStore';
import { useListenerWidgetsStore } from '../stores/listenerWidgetsStore';
import { renderWithRouter } from '../test/renderWithRouter';
import { LatestNewsWidget } from './LatestNewsWidget';

vi.mock('../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/client')>()),
  fetchAnnouncements: vi.fn(),
}));
vi.mock('../api/rss-feed', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/rss-feed')>()),
  fetchRssArticles: vi.fn(),
}));

const platformPost: Announcement = {
  id: 'news-1',
  headline: 'Tahti is open',
  summary: 'Come find your next favourite.',
  imageUrl: null,
  authorName: 'Board',
  publishedAt: '2030-05-02T09:00:00.000Z',
};

const BOARD = {
  id: 'board',
  username: 'board',
  displayName: 'Board',
  role: 'BOARD',
  isBoard: true,
  isMember: true,
} as AuthUser;

const LISTENER = {
  id: 'listener',
  username: 'listener',
  displayName: 'Listener',
} as AuthUser;

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
  vi.mocked(fetchAnnouncements).mockResolvedValue({
    data: [platformPost],
    meta: { source: 'api' },
  });
  vi.mocked(fetchRssArticles).mockResolvedValue({
    data: [
      {
        id: 'rss-1',
        title: 'Modular synth roundup',
        teaser: 'Five new modules.',
        publishedAt: '2030-05-01T09:00:00.000Z',
      },
    ],
    meta: { source: 'api' },
  });
  useListenerWidgetsStore.setState({
    installedTypeIds: ['news'],
    instances: [
      {
        id: 'cdm',
        typeId: 'news',
        input: 'https://cdm.link/feed/',
        label: 'CDM',
        addedAt: '2030-05-01T00:00:00.000Z',
      },
    ],
  });
});

afterEach(() => {
  useAuthStore.setState({ user: null });
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function renderWidget(user: AuthUser | null) {
  useAuthStore.setState({ user, hydrated: true });
  await renderWithRouter(<LatestNewsWidget surface="listen" />);
  await screen.findByText('Modular synth roundup');
}

describe('LatestNewsWidget editing', () => {
  it('shows a board member an edit icon on Tahti news only, not on RSS items', async () => {
    await renderWidget(BOARD);

    const edits = screen.getAllByTestId('news-edit');
    expect(edits).toHaveLength(1);
    expect(edits[0]).toHaveAccessibleName('Edit “Tahti is open”');
    const removes = screen.getAllByTestId('news-remove');
    expect(removes).toHaveLength(1);
    expect(removes[0]).toHaveAccessibleName('Remove “Tahti is open”');
  });

  it('shows no edit icon to other listeners or signed-out visitors', async () => {
    await renderWidget(LISTENER);
    expect(screen.queryByTestId('news-edit')).toBeNull();
    expect(screen.queryByTestId('news-remove')).toBeNull();
  });

  it('saves from the edit modal and updates the item in the list', async () => {
    const update = vi
      .spyOn(adminApi, 'updateNewsPost')
      .mockResolvedValue({ ok: true });
    await renderWidget(BOARD);

    await userEvent.click(screen.getByTestId('news-edit'));
    const dialog = await screen.findByRole('dialog', { name: 'Edit article' });
    const headline = within(dialog).getByLabelText('Headline');
    await userEvent.clear(headline);
    await userEvent.type(headline, 'Tahti is open for everyone');
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Save article' }),
    );

    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Edit article' })).toBeNull(),
    );
    expect(update).toHaveBeenCalledWith('news-1', {
      headline: 'Tahti is open for everyone',
      summary: 'Come find your next favourite.',
      imageUrl: null,
    });
    expect(screen.getByText('Tahti is open for everyone')).toBeVisible();
    expect(screen.queryByText('Tahti is open')).toBeNull();
  });

  it('removes a post after the confirmation and only once the API succeeds', async () => {
    const remove = vi
      .spyOn(adminApi, 'deleteNewsPost')
      .mockResolvedValue({ ok: true });
    await renderWidget(BOARD);

    await userEvent.click(screen.getByTestId('news-remove'));
    const dialog = await screen.findByRole('dialog', {
      name: 'Remove “Tahti is open”?',
    });
    expect(remove).not.toHaveBeenCalled();
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Remove' }),
    );

    await waitFor(() => expect(screen.queryByText('Tahti is open')).toBeNull());
    expect(remove).toHaveBeenCalledWith('news-1');
    expect(screen.getByText('Modular synth roundup')).toBeVisible();
  });

  it('keeps the post when the removal is cancelled', async () => {
    const remove = vi.spyOn(adminApi, 'deleteNewsPost');
    await renderWidget(BOARD);

    await userEvent.click(screen.getByTestId('news-remove'));
    const dialog = await screen.findByRole('dialog', {
      name: 'Remove “Tahti is open”?',
    });
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Cancel' }),
    );

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(remove).not.toHaveBeenCalled();
    expect(screen.getByText('Tahti is open')).toBeVisible();
  });

  it('keeps the post and shows an error when the API fails', async () => {
    vi.spyOn(adminApi, 'deleteNewsPost').mockResolvedValue({
      ok: false,
      error: 'HTTP 500',
    });
    const error = vi.spyOn(toast, 'error');
    await renderWidget(BOARD);

    await userEvent.click(screen.getByTestId('news-remove'));
    const dialog = await screen.findByRole('dialog', {
      name: 'Remove “Tahti is open”?',
    });
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Remove' }),
    );

    await waitFor(() => expect(error).toHaveBeenCalledWith('HTTP 500'));
    expect(screen.getByText('Tahti is open')).toBeVisible();
  });
});
