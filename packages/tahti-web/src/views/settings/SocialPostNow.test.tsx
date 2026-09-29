// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../api/social-autopost';
import { connectedPlatforms, SocialPostNow } from './SocialPostNow';

function status(connected: boolean): api.SocialPlatformStatus {
  return {
    connected,
    accountLabel: connected ? 'me' : null,
    onReleasePublished: false,
    onChannelLive: false,
    postTemplate: api.DEFAULT_SOCIAL_TEMPLATE,
  };
}

function settings(
  mastodon: boolean,
  bluesky: boolean,
): api.SocialAutoPostSettings {
  return {
    mastodon: status(mastodon),
    bluesky: status(bluesky),
    twitter: { ...status(false), configured: false },
    instagram: { ...status(false), configured: false },
  };
}

const FAILED: api.SocialPostLog = {
  id: 'p1',
  platform: 'BLUESKY',
  trigger: 'channel_live',
  state: 'FAILED',
  message: 'Live now on Tahti',
  externalId: null,
  error: 'Session expired',
  createdAt: '2026-09-28T10:00:00.000Z',
  sentAt: null,
};

describe('SocialPostNow', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('lists only connected platforms', () => {
    expect(connectedPlatforms(settings(false, true))).toEqual(['BLUESKY']);
    expect(connectedPlatforms(settings(false, false))).toEqual([]);
  });

  it('queues a post to the connected platform and refreshes the log', async () => {
    const fetchPosts = vi
      .spyOn(api, 'fetchSocialPosts')
      .mockResolvedValueOnce({ data: [], meta: { source: 'api' } })
      .mockResolvedValueOnce({ data: [FAILED], meta: { source: 'api' } });
    const post = vi
      .spyOn(api, 'postToSocial')
      .mockResolvedValue({ ok: true, post: FAILED });
    await act(async () => {
      render(<SocialPostNow settings={settings(false, true)} />);
    });
    expect(screen.getByText('Nothing posted yet.')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Message'), {
      target: { value: '  New mix out  ' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Post to Bluesky/ }));
    });

    expect(post).toHaveBeenCalledWith('BLUESKY', 'New mix out');
    expect(fetchPosts).toHaveBeenCalledTimes(2);
    const log = screen.getByTestId('social-posts');
    expect(within(log).getByText('Failed')).toBeTruthy();
    expect(within(log).getByText('Session expired')).toBeTruthy();
    expect(within(log).getByText(/Went live/)).toBeTruthy();
  });

  it('shows no form without a connected account', async () => {
    vi.spyOn(api, 'fetchSocialPosts').mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    });
    await act(async () => {
      render(<SocialPostNow settings={settings(false, false)} />);
    });
    expect(screen.queryByText('Post now')).toBeNull();
    expect(screen.queryByText('Nothing posted yet.')).toBeNull();
  });
});
