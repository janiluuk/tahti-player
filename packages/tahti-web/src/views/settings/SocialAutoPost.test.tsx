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
import { SocialAutoPost } from './SocialAutoPost';

function status(
  overrides: Partial<api.SocialPlatformStatus> = {},
): api.SocialPlatformStatus {
  return {
    connected: false,
    accountLabel: null,
    onReleasePublished: false,
    onChannelLive: false,
    postTemplate: api.DEFAULT_SOCIAL_TEMPLATE,
    ...overrides,
  };
}

function settings(
  mastodon: api.SocialPlatformStatus = status(),
): api.SocialAutoPostSettings {
  return {
    mastodon,
    bluesky: status(),
    twitter: { ...status(), configured: false },
    instagram: { ...status(), configured: false },
  };
}

async function renderSection() {
  await act(async () => {
    render(<SocialAutoPost />);
  });
}

describe('SocialAutoPost', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('connects Mastodon with the instance, token and triggers', async () => {
    vi.spyOn(api, 'fetchSocialAutoPost').mockResolvedValue({
      data: settings(),
      meta: { source: 'api' },
    });
    const save = vi.spyOn(api, 'saveMastodon').mockResolvedValue({
      ok: true,
      data: settings(
        status({ connected: true, accountLabel: 'https://mastodon.social' }),
      ),
    });
    await renderSection();

    const mastodon = within(screen.getByRole('region', { name: 'Mastodon' }));
    const connect = mastodon.getByRole('button', { name: /Connect Mastodon/ });
    expect(connect).toHaveProperty('disabled', true);
    fireEvent.change(mastodon.getByLabelText('Instance URL'), {
      target: { value: 'https://mastodon.social' },
    });
    fireEvent.change(mastodon.getByLabelText('Access token'), {
      target: { value: 'secret' },
    });
    fireEvent.click(
      mastodon.getByRole('switch', { name: 'Post when I go live' }),
    );
    await act(async () => {
      fireEvent.click(connect);
    });

    expect(save).toHaveBeenCalledWith({
      instanceUrl: 'https://mastodon.social',
      accessToken: 'secret',
      onReleasePublished: false,
      onChannelLive: true,
      postTemplate: api.DEFAULT_SOCIAL_TEMPLATE,
    });
    expect(
      within(screen.getByRole('region', { name: 'Mastodon' })).getByText(
        'Connected as https://mastodon.social',
      ),
    ).toBeTruthy();
  });

  it('disconnects after a confirmation', async () => {
    const fetch = vi.spyOn(api, 'fetchSocialAutoPost').mockResolvedValue({
      data: settings(
        status({ connected: true, accountLabel: 'https://mastodon.social' }),
      ),
      meta: { source: 'api' },
    });
    const disconnect = vi
      .spyOn(api, 'disconnectSocial')
      .mockResolvedValue({ ok: true });
    await renderSection();

    const mastodon = within(screen.getByRole('region', { name: 'Mastodon' }));
    fireEvent.click(mastodon.getByRole('button', { name: 'Disconnect' }));
    expect(disconnect).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.click(
        within(screen.getByRole('dialog')).getByRole('button', {
          name: 'Disconnect',
        }),
      );
    });
    expect(disconnect).toHaveBeenCalledWith('mastodon');
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
