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

import * as mentions from '../../../api/me-mentions';
import { MentionsPanel } from './MentionsPanel';

async function renderPanel() {
  const router = createRouter({
    routeTree: createRootRoute({ component: () => <MentionsPanel /> }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
}

describe('mention helpers', () => {
  it('names the surface and never uses an email as the name', () => {
    expect(mentions.mentionSurfaceLabel('RELEASE')).toBe('a release');
    expect(mentions.mentionSurfaceLabel('SOMETHING_NEW')).toBe('a post');
    expect(
      mentions.mentionerName({
        username: 'veikko',
        displayName: 'veikko@example.fi',
        avatarUrl: null,
      }),
    ).toBe('veikko');
    expect(mentions.normalizeHandle(' @Aurora ')).toBe('Aurora');
  });

  it('refuses something that is not a username before sending', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await expect(
      mentions.setMentionMute('two words', true),
    ).resolves.toMatchObject({ ok: false });
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});

describe('MentionsPanel', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('links a mention to where it happened', async () => {
    vi.spyOn(mentions, 'fetchMentionSettings').mockResolvedValue({
      ok: true,
      data: { mentionsEnabled: true, publicMentionsEnabled: false, muted: [] },
    });
    const mentioner = {
      username: 'aurora',
      displayName: 'Aurora',
      avatarUrl: null,
    };
    vi.spyOn(mentions, 'fetchMentions').mockResolvedValue({
      ok: true,
      data: [
        {
          id: 'm1',
          surface: 'RELEASE',
          createdAt: '2026-09-28T18:00:00.000Z',
          mentioner,
          sourceTitle: 'Northern Lights EP',
          sourceUrl: '/r/northern-lights',
        },
        {
          id: 'm2',
          surface: 'CHAT',
          createdAt: '2026-09-28T17:00:00.000Z',
          mentioner,
          sourceTitle: 'Aurora',
          sourceUrl: '/chat/aurora',
        },
        {
          id: 'm3',
          surface: 'TRACKLIST',
          createdAt: '2026-09-28T16:00:00.000Z',
          mentioner,
          sourceTitle: null,
          sourceUrl: 'https://elsewhere.example/t/1',
        },
      ],
    });

    await renderPanel();
    expect(
      screen
        .getByRole('link', { name: 'a release: Northern Lights EP' })
        .getAttribute('href'),
    ).toBe('/r/northern-lights');
    expect(
      screen.getByRole('link', { name: 'chat' }).getAttribute('href'),
    ).toBe('/chat/aurora');
    expect(screen.getByText('mentioned you in a tracklist')).toBeTruthy();
    expect(screen.queryByRole('link', { name: /tracklist/ })).toBeNull();
  });

  it('lists mentions, mutes by username and unmutes', async () => {
    vi.spyOn(mentions, 'fetchMentionSettings').mockResolvedValue({
      ok: true,
      data: {
        mentionsEnabled: true,
        publicMentionsEnabled: false,
        muted: [{ username: 'spammy', displayName: 'Spammy' }],
      },
    });
    vi.spyOn(mentions, 'fetchMentions').mockResolvedValue({
      ok: true,
      data: [
        {
          id: 'm1',
          surface: 'RELEASE',
          createdAt: '2026-09-28T18:00:00.000Z',
          mentioner: {
            username: 'aurora',
            displayName: 'Aurora',
            avatarUrl: null,
          },
        },
      ],
    });
    const mute = vi
      .spyOn(mentions, 'setMentionMute')
      .mockResolvedValue({ ok: true, data: 'x' });

    await renderPanel();
    expect(screen.getByRole('link', { name: 'Aurora' })).toBeTruthy();
    expect(screen.getByText('mentioned you in a release')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Mute a username'), {
      target: { value: '@someone' },
    });
    await act(async () => {
      fireEvent.submit(
        screen.getByLabelText('Mute a username').closest('form')!,
      );
    });
    expect(mute).toHaveBeenCalledWith('@someone', true);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Unmute' }));
    });
    expect(mute).toHaveBeenCalledWith('spammy', false);
  });

  it('saves a preference and rolls back when it fails', async () => {
    vi.spyOn(mentions, 'fetchMentionSettings').mockResolvedValue({
      ok: true,
      data: { mentionsEnabled: true, publicMentionsEnabled: false, muted: [] },
    });
    vi.spyOn(mentions, 'fetchMentions').mockResolvedValue({
      ok: true,
      data: [],
    });
    const patch = vi
      .spyOn(mentions, 'patchMentionSettings')
      .mockResolvedValue({ ok: false, error: 'Nope' });

    await renderPanel();
    const toggle = screen.getByRole('switch', {
      name: 'Show mentions on my public profile',
    });
    await act(async () => {
      fireEvent.click(toggle);
    });
    expect(patch).toHaveBeenCalledWith({ publicMentionsEnabled: true });
    expect(toggle.getAttribute('aria-checked')).toBe('false');
  });
});
