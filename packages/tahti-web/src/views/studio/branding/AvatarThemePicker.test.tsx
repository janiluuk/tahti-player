// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../api/studio-extras';
import type { ProfileFields } from '../../../api/studio-extras';
import { AvatarThemePicker } from './AvatarThemePicker';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const saved = { ok: true as const, data: {} as ProfileFields };

describe('AvatarThemePicker', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('saves the picked swatch', async () => {
    const spy = vi.spyOn(api, 'patchMeProfile').mockResolvedValue(saved);
    const onChange = vi.fn();
    render(<AvatarThemePicker value={null} onChange={onChange} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Avatar colour 1' }));
    });
    const theme = {
      kind: 'gradient',
      colors: ['#A78BFA', '#22D3EE'],
      angle: 135,
    };
    expect(spy).toHaveBeenCalledWith({ avatarTheme: theme });
    expect(onChange).toHaveBeenCalledWith(theme);
  });

  it('marks the saved theme and clears it with Default', async () => {
    const spy = vi.spyOn(api, 'patchMeProfile').mockResolvedValue(saved);
    const onChange = vi.fn();
    render(
      <AvatarThemePicker
        value={{ kind: 'solid', colors: ['#22D3EE'] }}
        onChange={onChange}
      />,
    );
    expect(
      screen
        .getByRole('button', { name: 'Avatar colour 12' })
        .getAttribute('aria-pressed'),
    ).toBe('true');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Default' }));
    });
    expect(spy).toHaveBeenCalledWith({ avatarTheme: null });
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('keeps the old theme when the save fails', async () => {
    vi.spyOn(api, 'patchMeProfile').mockResolvedValue({
      ok: false,
      error: 'Save failed',
    });
    const onChange = vi.fn();
    render(<AvatarThemePicker value={null} onChange={onChange} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Avatar colour 2' }));
    });
    expect(onChange).not.toHaveBeenCalled();
  });
});
