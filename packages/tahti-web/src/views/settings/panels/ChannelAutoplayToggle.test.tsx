// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../api/channel-autoplay';
import { ChannelAutoplayToggle } from './ChannelAutoplayToggle';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const NAME = 'Start playing when someone opens my channel';

async function renderToggle(value: boolean | null) {
  vi.spyOn(api, 'fetchChannelAutoplay').mockResolvedValue(value);
  await act(async () => {
    render(<ChannelAutoplayToggle />);
  });
}

describe('ChannelAutoplayToggle', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('shows the stored setting and saves a change', async () => {
    const save = vi
      .spyOn(api, 'setChannelAutoplay')
      .mockResolvedValue({ ok: true });
    await renderToggle(true);
    const toggle = screen.getByRole('switch', { name: NAME });
    expect(toggle.getAttribute('aria-checked')).toBe('true');

    await act(async () => {
      fireEvent.click(toggle);
    });
    expect(save).toHaveBeenCalledWith(false);
    expect(toggle.getAttribute('aria-checked')).toBe('false');
    expect(toast.success).toHaveBeenCalledWith('Autoplay setting saved.');
  });

  it('puts the switch back when the save fails', async () => {
    vi.spyOn(api, 'setChannelAutoplay').mockResolvedValue({
      ok: false,
      error: 'Channel not found',
    });
    await renderToggle(false);
    const toggle = screen.getByRole('switch', { name: NAME });
    await act(async () => {
      fireEvent.click(toggle);
    });
    expect(toggle.getAttribute('aria-checked')).toBe('false');
    expect(toast.error).toHaveBeenCalledWith('Channel not found');
  });

  it('is not drawn when the setting cannot be read', async () => {
    await renderToggle(null);
    expect(screen.queryByRole('switch')).toBeNull();
  });
});
