// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as admin from '../../api/admin';
import { AdminChannelKindControl } from './AdminChannelKindControl';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe('AdminChannelKindControl', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('marks a channel as a radio station', async () => {
    const save = vi
      .spyOn(admin, 'setAdminChannelKind')
      .mockResolvedValue({ ok: true, channelKind: 'RADIO' });
    render(<AdminChannelKindControl slug="kaski" initialKind="ARTIST" />);
    fireEvent.click(screen.getByRole('radio', { name: 'Radio station' }));
    await vi.waitFor(() => expect(save).toHaveBeenCalledWith('kaski', 'RADIO'));
    expect(
      screen
        .getByRole('radio', { name: 'Radio station' })
        .getAttribute('aria-checked'),
    ).toBe('true');
  });

  it('goes back to the saved type when the API refuses', async () => {
    vi.spyOn(admin, 'setAdminChannelKind').mockResolvedValue({
      ok: false,
      error: 'Channel not found',
    });
    render(<AdminChannelKindControl slug="kaski" initialKind="ARTIST" />);
    fireEvent.click(screen.getByRole('radio', { name: 'Radio station' }));
    await vi.waitFor(() =>
      expect(
        screen
          .getByRole('radio', { name: 'Artist' })
          .getAttribute('aria-checked'),
      ).toBe('true'),
    );
  });
});
