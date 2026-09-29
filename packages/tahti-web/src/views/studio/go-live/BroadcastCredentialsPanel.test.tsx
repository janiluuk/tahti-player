// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as broadcast from '../../../api/broadcast';
import { BroadcastCredentialsPanel } from './BroadcastCredentialsPanel';
import type { GoLiveState } from './useGoLiveState';

const SETTINGS: broadcast.StreamSettings = {
  rtmp: { server: 'rtmp://ingest/live', streamKey: 'slug__old' },
  icecast: {
    server: 'https://icecast',
    mount: '/slug',
    password: 'old-pass',
  },
  hlsUrl: 'https://hls/slug.m3u8',
};

function Harness({ channelState }: { channelState: string }) {
  const [settings, setSettings] = useState<broadcast.StreamSettings | null>(
    SETTINGS,
  );
  const [expanded, setExpanded] = useState(true);
  const [ingest, setIngest] = useState<GoLiveState['ingest']>('icecast');
  const state = {
    settings,
    setSettings,
    channelState,
    credentialsExpanded: expanded,
    setCredentialsExpanded: setExpanded,
    ingest,
    setIngest,
    displayName: 'Artist',
    slug: 'slug',
  } as unknown as GoLiveState;
  return (
    <>
      <BroadcastCredentialsPanel state={state} />
      <output data-testid="key">{settings?.rtmp.streamKey}</output>
    </>
  );
}

describe('BroadcastCredentialsPanel rotation', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('makes a new stream key after a confirmation that mentions the live grace period', async () => {
    const rotate = vi
      .spyOn(broadcast, 'rotateRtmpStreamKey')
      .mockResolvedValue({ ok: true, streamKey: 'slug__new' });
    render(<Harness channelState="LIVE" />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Make a new stream key' }),
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog.textContent).toContain('keeps working for 24 hours');
    expect(rotate).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.click(
        within(dialog).getByRole('button', { name: 'Make a new one' }),
      );
    });

    expect(rotate).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('key').textContent).toBe('slug__new');
  });

  it('rotates the Icecast password and warns it stops working when offline', async () => {
    const rotate = vi
      .spyOn(broadcast, 'rotateIcecastPassword')
      .mockResolvedValue({ ok: true, password: 'new-pass' });
    render(<Harness channelState="OFFLINE" />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Make a new Icecast password' }),
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog.textContent).toContain('stops working right away');
    await act(async () => {
      fireEvent.click(
        within(dialog).getByRole('button', { name: 'Make a new one' }),
      );
    });
    expect(rotate).toHaveBeenCalledTimes(1);
    expect(screen.getByText('new-pass')).toBeTruthy();
  });
});
