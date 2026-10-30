// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as presets from '../../../api/artwork-presets';
import * as api from '../../../api/image-from-url';
import * as media from '../../../api/user-media';
import { ProfilePictureSection } from './ProfilePictureSection';
import type { PressKitState } from './usePressKit';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const profile = { avatarTheme: null };

function renderSection(avatarUrl: string | null, handleAvatarChange = vi.fn()) {
  render(
    <ProfilePictureSection
      kit={
        {
          avatarUrl,
          handleAvatarChange,
          profile,
          setProfile: vi.fn(),
        } as unknown as PressKitState
      }
    />,
  );
  return handleAvatarChange;
}

async function openPicker() {
  await act(async () => {
    fireEvent.click(
      screen.getByRole('button', { name: 'Change profile picture' }),
    );
  });
}

describe('ProfilePictureSection', () => {
  beforeEach(() => {
    vi.spyOn(presets, 'fetchArtworkPresets').mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    } as never);
    vi.spyOn(media, 'fetchUserMedia').mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    } as never);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows the image link box only in the dialog opened from the avatar', async () => {
    renderSection(null);
    expect(screen.queryByLabelText('Image URL')).toBeNull();
    await openPicker();
    expect(screen.getByLabelText('Image URL')).toBeTruthy();
  });

  it('sets the profile picture from an image link and closes the dialog', async () => {
    const spy = vi
      .spyOn(api, 'setProfileAvatarFromUrl')
      .mockResolvedValue({ ok: true, url: 'https://cdn/a.jpg' });
    const handleAvatarChange = renderSection(null);
    await openPicker();
    fireEvent.change(screen.getByLabelText('Image URL'), {
      target: { value: 'https://example.com/me.jpg' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Use this image' }));
    });
    expect(spy).toHaveBeenCalledWith('https://example.com/me.jpg');
    expect(handleAvatarChange).toHaveBeenCalledWith('https://cdn/a.jpg');
    await waitFor(() =>
      expect(screen.queryByTestId('cover-art-picker')).toBeNull(),
    );
  });

  it('leaves the picture alone and keeps the dialog open when the link is refused', async () => {
    vi.spyOn(api, 'setProfileAvatarFromUrl').mockResolvedValue({
      ok: false,
      error: 'Not an image',
    });
    const handleAvatarChange = renderSection(null);
    await openPicker();
    fireEvent.change(screen.getByLabelText('Image URL'), {
      target: { value: 'https://example.com/page' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Use this image' }));
    });
    expect(handleAvatarChange).not.toHaveBeenCalled();
    expect(screen.getByTestId('cover-art-picker')).toBeTruthy();
  });

  it('offers avatar colours only when there is no picture', () => {
    renderSection(null);
    expect(
      screen.getByRole('button', { name: 'Avatar colour 1' }),
    ).toBeTruthy();
    expect(screen.queryByTestId('avatar-theme-hint')).toBeNull();
    cleanup();

    renderSection('https://cdn/me.jpg');
    expect(
      screen.queryByRole('button', { name: 'Avatar colour 1' }),
    ).toBeNull();
    expect(screen.getByTestId('avatar-theme-hint').textContent).toContain(
      'only when there is no profile picture',
    );
  });
});
