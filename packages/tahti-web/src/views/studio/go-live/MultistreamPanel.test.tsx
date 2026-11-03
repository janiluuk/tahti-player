// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as broadcast from '../../../api/broadcast';
import { MultistreamPanel } from './MultistreamPanel';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

describe('MultistreamPanel', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('removes a destination only after a red confirm', async () => {
    const remove = vi
      .spyOn(broadcast, 'deleteRtmpTarget')
      .mockResolvedValue({ ok: true });
    const reload = vi.fn();
    render(
      <MultistreamPanel
        targets={[
          {
            id: 't1',
            provider: 'TWITCH',
            label: 'My Twitch',
            rtmpUrl: 'rtmp://live.twitch.tv/app',
            alwaysMirror: false,
            enabled: true,
            keyLast4: '4321',
          },
        ]}
        reload={reload}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Remove My Twitch' }));
    const confirm = screen.getByRole('button', { name: 'Remove' });
    expect(confirm.className).toContain('bg-accent-red');
    expect(remove).not.toHaveBeenCalled();
    fireEvent.click(confirm);
    await waitFor(() => expect(remove).toHaveBeenCalledWith('t1'));
    await waitFor(() => expect(reload).toHaveBeenCalled());
  });
});
