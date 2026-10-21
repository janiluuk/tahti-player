// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../api/profile-logo';
import { ProfileLogoSection } from './ProfileLogoSection';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

describe('ProfileLogoSection', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('uploads a logo and defaults it onto the avatar', async () => {
    const upload = vi.spyOn(api, 'uploadProfileLogo').mockResolvedValue({
      ok: true,
      data: { logoUrl: 'https://cdn/logo.png' },
    });
    const onChange = vi.fn();
    const { container } = render(
      <ProfileLogoSection
        logoUrl={null}
        logoPlacement={null}
        onChange={onChange}
      />,
    );
    const file = new File(['x'], 'logo.png', { type: 'image/png' });
    await act(async () => {
      fireEvent.change(container.querySelector('input[type="file"]')!, {
        target: { files: [file] },
      });
    });
    expect(upload).toHaveBeenCalledWith(file);
    expect(onChange).toHaveBeenCalledWith({
      logoUrl: 'https://cdn/logo.png',
      logoPlacement: 'AVATAR',
    });
  });

  it('moves the logo onto the cover and removes it', async () => {
    const place = vi
      .spyOn(api, 'setProfileLogoPlacement')
      .mockResolvedValue({ ok: true });
    vi.spyOn(api, 'removeProfileLogo').mockResolvedValue({ ok: true });
    const onChange = vi.fn();
    render(
      <ProfileLogoSection
        logoUrl="https://cdn/logo.png"
        logoPlacement="AVATAR"
        onChange={onChange}
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole('radio', { name: 'On cover' }));
    });
    expect(place).toHaveBeenCalledWith('COVER');
    expect(onChange).toHaveBeenLastCalledWith({
      logoUrl: 'https://cdn/logo.png',
      logoPlacement: 'COVER',
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Remove logo' }));
    });
    expect(onChange).toHaveBeenLastCalledWith({
      logoUrl: null,
      logoPlacement: 'AVATAR',
    });
  });
});
