import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as studio from '../../../api/studio';
import { StemsPanel } from './StemsPanel';

vi.mock('sonner', () => ({
  toast: { info: vi.fn(), error: vi.fn(), success: vi.fn() },
}));

describe('StemsPanel', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('says the artist is notified when the stems are ready', async () => {
    vi.spyOn(studio, 'fetchSoundStems').mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    } as never);
    vi.spyOn(studio, 'requestSoundStems').mockResolvedValue({
      ok: true,
    } as never);
    await act(async () => {
      render(<StemsPanel soundId="s1" />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Split into stems/ }));
    });
    expect(toast.info).toHaveBeenCalledWith(
      expect.stringContaining('We notify you when the stems are ready.'),
    );
  });
});
