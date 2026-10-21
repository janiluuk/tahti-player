// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../api/image-from-url';
import { ProfilePictureSection } from './ProfilePictureSection';
import type { PressKitState } from './usePressKit';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

describe('ProfilePictureSection', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('sets the profile picture from an image link', async () => {
    const spy = vi
      .spyOn(api, 'setProfileAvatarFromUrl')
      .mockResolvedValue({ ok: true, url: 'https://cdn/a.jpg' });
    const handleAvatarChange = vi.fn();
    render(
      <ProfilePictureSection
        kit={
          { avatarUrl: null, handleAvatarChange } as unknown as PressKitState
        }
      />,
    );
    fireEvent.change(screen.getByLabelText('Image URL'), {
      target: { value: 'https://example.com/me.jpg' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Use this image' }));
    });
    expect(spy).toHaveBeenCalledWith('https://example.com/me.jpg');
    expect(handleAvatarChange).toHaveBeenCalledWith('https://cdn/a.jpg');
  });

  it('leaves the picture alone when the link is refused', async () => {
    vi.spyOn(api, 'setProfileAvatarFromUrl').mockResolvedValue({
      ok: false,
      error: 'Not an image',
    });
    const handleAvatarChange = vi.fn();
    render(
      <ProfilePictureSection
        kit={
          { avatarUrl: null, handleAvatarChange } as unknown as PressKitState
        }
      />,
    );
    fireEvent.change(screen.getByLabelText('Image URL'), {
      target: { value: 'https://example.com/page' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Use this image' }));
    });
    expect(handleAvatarChange).not.toHaveBeenCalled();
  });
});
