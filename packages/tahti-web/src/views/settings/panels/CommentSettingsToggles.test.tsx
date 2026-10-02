// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../api/comment-settings';
import { CommentSettingsToggles } from './CommentSettingsToggles';

async function renderToggles(settings: api.CommentSettings) {
  vi.spyOn(api, 'fetchCommentSettings').mockResolvedValue({
    ok: true,
    data: settings,
  });
  await act(async () => {
    render(<CommentSettingsToggles />);
  });
}

describe('CommentSettingsToggles', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('saves the channel switch and the new-upload default', async () => {
    await renderToggles({
      channelCommentsEnabled: true,
      newUploadCommentsEnabled: true,
      newChannelCommentsEnabled: true,
    });
    const channel = vi
      .spyOn(api, 'setChannelCommentsEnabled')
      .mockResolvedValue({ ok: true, enabled: false });
    const uploads = vi
      .spyOn(api, 'setNewUploadCommentsEnabled')
      .mockResolvedValue({ ok: false, error: 'Nope' });
    const channelSwitch = screen.getByRole('switch', {
      name: 'Allow comments on my channel',
    });
    await act(async () => {
      fireEvent.click(channelSwitch);
    });
    expect(channel).toHaveBeenCalledWith(false);
    expect(channelSwitch.getAttribute('aria-checked')).toBe('false');

    const uploadSwitch = screen.getByRole('switch', {
      name: 'Allow comments on my new uploads',
    });
    await act(async () => {
      fireEvent.click(uploadSwitch);
    });
    expect(uploads).toHaveBeenCalledWith(false);
    expect(uploadSwitch.getAttribute('aria-checked')).toBe('true');
    expect(
      screen.queryByRole('switch', {
        name: 'Allow comments on my channel when it is created',
      }),
    ).toBeNull();
  });

  it('offers the new-channel default without a channel', async () => {
    await renderToggles({
      channelCommentsEnabled: null,
      newUploadCommentsEnabled: true,
      newChannelCommentsEnabled: true,
    });
    expect(
      screen.queryByRole('switch', { name: 'Allow comments on my channel' }),
    ).toBeNull();
    expect(
      screen.getByRole('switch', { name: 'Allow comments on my new uploads' }),
    ).toBeTruthy();
    const save = vi
      .spyOn(api, 'setNewChannelCommentsEnabled')
      .mockResolvedValue({ ok: true, enabled: false });
    const channelDefault = screen.getByRole('switch', {
      name: 'Allow comments on my channel when it is created',
    });
    await act(async () => {
      fireEvent.click(channelDefault);
    });
    expect(save).toHaveBeenCalledWith(false);
    expect(channelDefault.getAttribute('aria-checked')).toBe('false');
  });
});
