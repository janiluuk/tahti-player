// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as broadcast from '../api/broadcast';
import type { AuthUser } from '../api/types';
import { useAuthStore } from '../stores/authStore';
import { MulticastConfigureDialog } from './MulticastConfigureDialog';

const MIRROR_LABEL = "Keep mirroring the 24/7 rotation when I'm offline";

const target = (alwaysMirror = false): broadcast.RtmpTarget => ({
  id: 't1',
  provider: 'TWITCH',
  label: 'My Twitch',
  rtmpUrl: 'rtmp://live.twitch.tv/app',
  alwaysMirror,
  enabled: true,
  keyLast4: '1234',
});

const signIn = (tier: string) =>
  useAuthStore.setState({ user: { username: 'artist', tier } as AuthUser });

const renderDialog = (existing: broadcast.RtmpTarget | null) =>
  render(
    <MulticastConfigureDialog
      configuring={{ provider: 'TWITCH', existing }}
      onClose={() => {}}
      onSaved={() => {}}
    />,
  );

describe('MulticastConfigureDialog rotation mirroring', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    useAuthStore.setState({ user: null });
  });

  it('hides the switch below STUDIO tier', () => {
    signIn('ARTIST');
    renderDialog(target());
    expect(screen.queryByRole('switch', { name: MIRROR_LABEL })).toBeNull();
  });

  it('still offers the switch below STUDIO when it is already on', () => {
    signIn('ARTIST');
    renderDialog(target(true));
    expect(screen.getByRole('switch', { name: MIRROR_LABEL })).toBeTruthy();
  });

  it('saves the change via PATCH for STUDIO', async () => {
    signIn('STUDIO');
    const patch = vi
      .spyOn(broadcast, 'patchRtmpTarget')
      .mockResolvedValue({ ok: true });
    renderDialog(target());
    fireEvent.click(screen.getByRole('switch', { name: MIRROR_LABEL }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Save destination/ }));
    });
    expect(patch).toHaveBeenCalledWith('t1', {
      label: 'My Twitch',
      enabled: true,
      alwaysMirror: true,
    });
  });

  it('leaves alwaysMirror out of an unrelated save', async () => {
    signIn('STUDIO');
    const patch = vi
      .spyOn(broadcast, 'patchRtmpTarget')
      .mockResolvedValue({ ok: true });
    renderDialog(target());
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Save destination/ }));
    });
    expect(patch.mock.calls[0]?.[1]).not.toHaveProperty('alwaysMirror');
  });

  it('hides the switch when the API refuses the change', async () => {
    signIn('STUDIO');
    vi.spyOn(broadcast, 'patchRtmpTarget').mockResolvedValue({
      ok: false,
      error: 'Mirroring the 24/7 rotation is available on the Studio tier',
    });
    renderDialog(target());
    fireEvent.click(screen.getByRole('switch', { name: MIRROR_LABEL }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Save destination/ }));
    });
    expect(screen.getByRole('alert').textContent).toContain('Studio tier');
    expect(screen.queryByRole('switch', { name: MIRROR_LABEL })).toBeNull();
  });

  it('sends alwaysMirror when creating a destination', async () => {
    signIn('STUDIO');
    const create = vi
      .spyOn(broadcast, 'createRtmpTarget')
      .mockResolvedValue({ ok: true, target: target(true) });
    renderDialog(null);
    fireEvent.change(screen.getByLabelText('Stream key / API key'), {
      target: { value: 'key' },
    });
    fireEvent.click(screen.getByRole('switch', { name: MIRROR_LABEL }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Save destination/ }));
    });
    expect(create.mock.calls[0]?.[0]).toMatchObject({ alwaysMirror: true });
  });
});
