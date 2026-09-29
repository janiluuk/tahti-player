// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../api/username-available';
import { UsernameAvailabilityHint } from './UsernameAvailabilityHint';

async function renderHint(username: string, onPick = vi.fn()) {
  render(<UsernameAvailabilityHint username={username} onPick={onPick} />);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(500);
  });
  return onPick;
}

describe('UsernameAvailabilityHint', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('says when the handle is free', async () => {
    const spy = vi
      .spyOn(api, 'fetchUsernameAvailability')
      .mockResolvedValue({ available: true });
    await renderHint('night-drive');
    expect(spy).toHaveBeenCalledWith('night-drive');
    expect(screen.getByTestId('username-hint').textContent).toBe(
      'night-drive is free.',
    );
  });

  it('offers the suggestions when the handle is taken', async () => {
    vi.spyOn(api, 'fetchUsernameAvailability').mockResolvedValue({
      available: false,
      suggestions: ['dj-live', 'dj-music'],
    });
    const onPick = await renderHint('dj');
    expect(screen.getByTestId('username-hint').textContent).toContain(
      'dj is taken.',
    );
    fireEvent.click(screen.getByRole('button', { name: 'dj-music' }));
    expect(onPick).toHaveBeenCalledWith('dj-music');
  });

  it('skips the check for a handle the API would reject', async () => {
    const spy = vi.spyOn(api, 'fetchUsernameAvailability');
    await renderHint('x');
    expect(spy).not.toHaveBeenCalled();
    expect(screen.getByText(/needs 2–32 letters/)).toBeTruthy();
  });

  it('just shows the handle when the check fails', async () => {
    vi.spyOn(api, 'fetchUsernameAvailability').mockResolvedValue(null);
    await renderHint('night-drive');
    expect(screen.getByTestId('username-hint').textContent).toBe(
      'Your handle: night-drive',
    );
  });
});
