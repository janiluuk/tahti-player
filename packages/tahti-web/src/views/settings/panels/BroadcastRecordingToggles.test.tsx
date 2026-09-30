// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as broadcast from '../../../api/broadcast';
import * as publish from '../../../api/publish-defaults';
import { BroadcastRecordingToggles } from './BroadcastRecordingToggles';

async function renderToggles(autoRecord: boolean, autoPublish: boolean) {
  vi.spyOn(broadcast, 'fetchAutoRecordEnabled').mockResolvedValue({
    data: autoRecord,
    meta: { source: 'api' },
  });
  vi.spyOn(publish, 'fetchAutoPublishBroadcast').mockResolvedValue({
    ok: true,
    autoPublish,
  });
  await act(async () => {
    render(<BroadcastRecordingToggles />);
  });
}

describe('BroadcastRecordingToggles', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('saves the auto-publish default', async () => {
    await renderToggles(true, true);
    const save = vi
      .spyOn(publish, 'setAutoPublishBroadcast')
      .mockResolvedValue({ ok: true, autoPublish: false });
    const toggle = screen.getByRole('switch', {
      name: 'Publish recordings automatically',
    });
    expect(toggle.getAttribute('aria-checked')).toBe('true');
    await act(async () => {
      fireEvent.click(toggle);
    });
    expect(save).toHaveBeenCalledWith(false);
    expect(toggle.getAttribute('aria-checked')).toBe('false');
  });

  it('saves auto-record and hides auto-publish when recording is off', async () => {
    await renderToggles(false, true);
    expect(
      screen.queryByRole('switch', {
        name: 'Publish recordings automatically',
      }),
    ).toBeNull();
    const save = vi
      .spyOn(broadcast, 'patchAutoRecordEnabled')
      .mockResolvedValue({ ok: true });
    await act(async () => {
      fireEvent.click(
        screen.getByRole('switch', { name: 'Record my broadcasts' }),
      );
    });
    expect(save).toHaveBeenCalledWith(true);
    expect(
      screen.getByRole('switch', { name: 'Publish recordings automatically' }),
    ).toBeTruthy();
  });

  it('puts the switch back when saving fails', async () => {
    await renderToggles(true, true);
    vi.spyOn(publish, 'setAutoPublishBroadcast').mockResolvedValue({
      ok: false,
      error: 'Channel not found',
    });
    const toggle = screen.getByRole('switch', {
      name: 'Publish recordings automatically',
    });
    await act(async () => {
      fireEvent.click(toggle);
    });
    expect(toggle.getAttribute('aria-checked')).toBe('true');
  });
});
