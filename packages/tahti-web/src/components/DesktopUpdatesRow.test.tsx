import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useDesktopUpdateStore } from '../lib/updates/desktopUpdates';
import { DesktopUpdatesRow } from './DesktopUpdatesRow';

beforeEach(() => {
  useDesktopUpdateStore.setState({
    status: 'idle',
    update: null,
    progress: 0,
    error: null,
    checkOnStart: true,
  });
  globalThis.__TAHTI_NATIVE_UPDATER__ = {
    check: vi.fn(async () => ({ version: '1.48.0', notes: 'Faster search' })),
    install: vi.fn(async (onProgress: (percent: number) => void) =>
      onProgress(100),
    ),
    relaunch: vi.fn(async () => undefined),
  };
});

afterEach(() => {
  globalThis.__TAHTI_NATIVE_UPDATER__ = undefined;
});

describe('DesktopUpdatesRow', () => {
  it('checks, installs and asks to restart', async () => {
    render(<DesktopUpdatesRow />);
    expect(screen.getByText(/You have Tahti Player/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Check now' }));
    expect(
      await screen.findByText('Tahti Player 1.48.0 is available.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Faster search')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Install 1.48.0' }));
    expect(
      await screen.findByRole('button', { name: 'Restart to finish' }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Restart to finish' }));
    expect(globalThis.__TAHTI_NATIVE_UPDATER__?.relaunch).toHaveBeenCalled();
  });

  it('says when there is nothing new', async () => {
    globalThis.__TAHTI_NATIVE_UPDATER__!.check = async () => null;
    render(<DesktopUpdatesRow />);
    await act(async () => {
      await useDesktopUpdateStore.getState().check();
    });
    expect(
      screen.getByText('You have the latest version.'),
    ).toBeInTheDocument();
  });
});
