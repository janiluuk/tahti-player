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
  oauth: Partial<
    Pick<api.SocialAutoPostSettings, 'twitter' | 'instagram'>
  > = {},
): api.SocialAutoPostSettings {
  return {
    mastodon,
    bluesky: status(),
    twitter: { ...status(), configured: false },
    instagram: { ...status(), configured: false },
    ...oauth,
  };
}

async function renderSection() {
  vi.spyOn(api, 'fetchSocialPosts').mockResolvedValue({
    data: [],
    meta: { source: 'api' },
  });
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

  it('hides X and Instagram until the server has them configured', async () => {
    vi.spyOn(api, 'fetchSocialAutoPost').mockResolvedValue({
      data: settings(status(), {
        instagram: { ...status(), configured: true },
      }),
      meta: { source: 'api' },
    });
    const assign = vi.fn();
    vi.spyOn(window, 'location', 'get').mockReturnValue({
      ...window.location,
      assign,
    });
    await renderSection();

    expect(screen.queryByRole('region', { name: 'X / Twitter' })).toBeNull();
    const instagram = within(screen.getByRole('region', { name: 'Instagram' }));
    expect(instagram.queryByRole('switch')).toBeNull();
    fireEvent.click(
      instagram.getByRole('button', { name: 'Connect Instagram' }),
    );
    expect(assign).toHaveBeenCalledWith(
      '/tahti-api/api/me/social/instagram/oauth/start',
    );
  });

  it('saves X triggers and post text through the PATCH', async () => {
    vi.spyOn(api, 'fetchSocialAutoPost').mockResolvedValue({
      data: settings(status(), {
        twitter: {
          ...status({ connected: true, accountLabel: '@artist' }),
          configured: true,
        },
      }),
      meta: { source: 'api' },
    });
    const patch = vi.spyOn(api, 'patchSocialOAuth').mockResolvedValue({
      ok: true,
      data: settings(),
    });
    await renderSection();

    const twitter = within(screen.getByRole('region', { name: 'X / Twitter' }));
    expect(twitter.getByText('Connected as @artist')).toBeTruthy();
    expect(twitter.queryByRole('button', { name: /Connect/ })).toBeNull();
    fireEvent.click(twitter.getByRole('switch', { name: 'Post new releases' }));
    fireEvent.change(twitter.getByLabelText('Post text'), {
      target: { value: 'Out now: {release}' },
    });
    await act(async () => {
      fireEvent.click(twitter.getByRole('button', { name: 'Save' }));
    });

    expect(patch).toHaveBeenCalledWith('twitter', {
      onReleasePublished: true,
      onChannelLive: false,
      postTemplate: 'Out now: {release}',
    });
  });

  it('keeps a connected platform visible after it is unconfigured, so it can be disconnected', async () => {
    vi.spyOn(api, 'fetchSocialAutoPost').mockResolvedValue({
      data: settings(status(), {
        instagram: {
          ...status({ connected: true, accountLabel: '@artist' }),
          configured: false,
        },
      }),
      meta: { source: 'api' },
    });
    const disconnect = vi
      .spyOn(api, 'disconnectSocial')
      .mockResolvedValue({ ok: true });
    await renderSection();

    const instagram = within(screen.getByRole('region', { name: 'Instagram' }));
    fireEvent.click(instagram.getByRole('button', { name: 'Disconnect' }));
    await act(async () => {
      fireEvent.click(
        within(screen.getByRole('dialog')).getByRole('button', {
          name: 'Disconnect',
        }),
      );
    });
    expect(disconnect).toHaveBeenCalledWith('instagram');
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
