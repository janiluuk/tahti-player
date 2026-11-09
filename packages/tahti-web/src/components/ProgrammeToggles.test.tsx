import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as extras from '../api/studio-extras';
import { ProgrammeToggles } from './ProgrammeToggles';

const programme = {
  fallbackMode: 'shuffle' as const,
  fallbackEnabled: true,
  fallbackAutoEnroll: false,
  announcementsEnabled: true,
  items: [],
};

describe('ProgrammeToggles', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('saves a switch and flips it back when the save fails', async () => {
    vi.spyOn(extras, 'fetchProgramme').mockResolvedValue({
      data: programme,
      meta: { source: 'api' },
    } as never);
    const patch = vi
      .spyOn(extras, 'patchProgramme')
      .mockResolvedValue({ ok: false, error: 'Nope' } as never);
    await act(async () => {
      render(<ProgrammeToggles />);
    });
    const toggles = screen.getAllByRole('switch');
    expect(toggles).toHaveLength(3);
    const fallback = toggles[1]!;
    expect(fallback).toHaveAttribute('aria-checked', 'true');
    await act(async () => {
      fireEvent.click(fallback);
    });
    expect(patch).toHaveBeenCalledWith({ fallbackEnabled: false });
    expect(fallback).toHaveAttribute('aria-checked', 'true');
  });
});
