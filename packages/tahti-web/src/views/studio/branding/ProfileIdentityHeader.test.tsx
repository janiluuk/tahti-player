// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as artistSettings from '../../../api/artist-settings';
import * as presets from '../../../api/artwork-presets';
import * as imageFromUrl from '../../../api/image-from-url';
import * as backdropApi from '../../../api/profile-backdrop';
import type { ProfileFields } from '../../../api/studio-extras';
import * as media from '../../../api/user-media';
import { useAuthStore } from '../../../stores/authStore';
import { ProfileIdentityHeader } from './ProfileIdentityHeader';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const baseProfile = {
  id: 'user-1',
  username: 'artist',
  displayName: 'An Artist',
  avatarUrl: null,
  avatarTheme: null,
  backdropUrl: null,
} as unknown as ProfileFields;

let latest: ProfileFields | null = null;

function Harness({ initial }: { initial: Partial<ProfileFields> }) {
  const [profile, setProfile] = useState<ProfileFields | null>({
    ...baseProfile,
    ...initial,
  });
  latest = profile;
  return profile ? (
    <ProfileIdentityHeader profile={profile} setProfile={setProfile} />
  ) : null;
}

const renderHeader = (initial: Partial<ProfileFields> = {}) =>
  render(<Harness initial={initial} />);

async function click(name: string) {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name }));
  });
}

describe('ProfileIdentityHeader', () => {
  beforeEach(() => {
    latest = null;
    useAuthStore.setState({ refresh: vi.fn().mockResolvedValue(undefined) });
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

  it('puts an edit button on both the backdrop and the profile picture', () => {
    renderHeader();
    const header = screen.getByTestId('profile-identity-header');
    expect(
      within(screen.getByTestId('profile-identity-backdrop')).getByRole(
        'button',
        { name: 'Change backdrop' },
      ),
    ).toBeTruthy();
    expect(
      within(screen.getByTestId('profile-identity-avatar')).getByRole(
        'button',
        { name: 'Change profile picture' },
      ),
    ).toBeTruthy();
    expect(within(header).getByText('Add a backdrop')).toBeTruthy();
  });

  it('uploads a backdrop through the backdrop dialog', async () => {
    const upload = vi
      .spyOn(backdropApi, 'uploadProfileBackdrop')
      .mockResolvedValue({
        ok: true,
        data: { backdropUrl: 'https://cdn/b.jpg' },
      });
    renderHeader();
    await click('Change backdrop');
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Profile backdrop')).toBeTruthy();
    const file = new File(['x'], 'b.jpg', { type: 'image/jpeg' });
    await act(async () => {
      fireEvent.change(dialog.querySelector('input[type="file"]')!, {
        target: { files: [file] },
      });
    });
    expect(upload).toHaveBeenCalledWith(file);
    expect(latest?.backdropUrl).toBe('https://cdn/b.jpg');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('removes the current backdrop', async () => {
    const remove = vi
      .spyOn(backdropApi, 'removeProfileBackdrop')
      .mockResolvedValue({ ok: true });
    renderHeader({ backdropUrl: 'https://cdn/b.jpg' });
    await click('Change backdrop');
    expect(screen.getByTestId('profile-backdrop')).toBeTruthy();
    await click('Remove backdrop');
    expect(remove).toHaveBeenCalled();
    expect(latest?.backdropUrl).toBeNull();
  });

  it('opens the picture picker and saves an image link as the avatar', async () => {
    const fromUrl = vi
      .spyOn(imageFromUrl, 'setProfileAvatarFromUrl')
      .mockResolvedValue({ ok: true, url: 'https://cdn/a.jpg' });
    renderHeader();
    await click('Change profile picture');
    expect(screen.getByTestId('cover-art-picker')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Image URL'), {
      target: { value: 'https://example.com/me.jpg' },
    });
    await click('Use this image');
    expect(fromUrl).toHaveBeenCalledWith('https://example.com/me.jpg');
    expect(latest?.avatarUrl).toBe('https://cdn/a.jpg');
    await waitFor(() =>
      expect(screen.queryByTestId('cover-art-picker')).toBeNull(),
    );
  });

  it('offers avatar colours only when there is no picture', async () => {
    renderHeader();
    await click('Change profile picture');
    expect(
      screen.getByRole('button', { name: 'Avatar colour 1' }),
    ).toBeTruthy();
    expect(screen.queryByTestId('avatar-theme-hint')).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Remove profile picture' }),
    ).toBeNull();
    cleanup();

    renderHeader({ avatarUrl: 'https://cdn/me.jpg' });
    await click('Change profile picture');
    expect(
      screen.queryByRole('button', { name: 'Avatar colour 1' }),
    ).toBeNull();
    expect(screen.getByTestId('avatar-theme-hint')).toBeTruthy();
  });

  it('removes the profile picture after confirming', async () => {
    const remove = vi
      .spyOn(artistSettings, 'removeProfileAvatar')
      .mockResolvedValue({ ok: true });
    renderHeader({ avatarUrl: 'https://cdn/me.jpg' });
    await click('Change profile picture');
    await click('Remove profile picture');
    const confirm = await screen.findByRole('dialog');
    await act(async () => {
      fireEvent.click(within(confirm).getByRole('button', { name: 'Remove' }));
    });
    expect(remove).toHaveBeenCalled();
    expect(latest?.avatarUrl).toBeNull();
  });
});
