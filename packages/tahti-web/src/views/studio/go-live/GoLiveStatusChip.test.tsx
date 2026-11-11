// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { goLiveStatus, GoLiveStatusChip } from './GoLiveStatusChip';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('goLiveStatus', () => {
  it('derives each chip state', () => {
    const base = { isBroadcastLive: false, reconnecting: false };
    expect(goLiveStatus({ ...base, requiredDone: false })).toBe('offline');
    expect(goLiveStatus({ ...base, requiredDone: true })).toBe('ready');
    expect(
      goLiveStatus({ ...base, isBroadcastLive: true, requiredDone: true }),
    ).toBe('live');
    expect(
      goLiveStatus({
        isBroadcastLive: false,
        reconnecting: true,
        requiredDone: false,
      }),
    ).toBe('reconnecting');
  });
});

describe('GoLiveStatusChip', () => {
  it('is a status region with an offline dot', () => {
    render(
      <GoLiveStatusChip
        status="offline"
        liveSince={null}
        reconnectDeadline={null}
      />,
    );
    const chip = screen.getByRole('status');
    expect(chip).toHaveTextContent('Offline');
    expect(chip.querySelector('.bg-status-offline')).not.toBeNull();
  });

  it('uses the primary dot when ready', () => {
    render(
      <GoLiveStatusChip
        status="ready"
        liveSince={null}
        reconnectDeadline={null}
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Ready');
    expect(
      screen.getByRole('status').querySelector('.bg-primary'),
    ).not.toBeNull();
  });

  it('counts up the time on air while live', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-10T20:00:00.000Z'));
    render(
      <GoLiveStatusChip
        status="live"
        liveSince="2026-11-10T19:58:55.000Z"
        reconnectDeadline={null}
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Live1:05');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(screen.getByRole('status')).toHaveTextContent('Live1:07');
  });

  it('pulses a red dot while reconnecting, but not under reduced motion', () => {
    render(
      <GoLiveStatusChip
        status="reconnecting"
        liveSince={null}
        reconnectDeadline="2026-11-10T21:04:00.000Z"
      />,
    );
    const chip = screen.getByRole('status');
    expect(chip).toHaveTextContent(/Reconnecting.*until/);
    const dot = chip.querySelector('.bg-accent-red');
    expect(dot?.className).toContain('animate-pulse');
    expect(dot?.className).toContain('motion-reduce:animate-none');
  });
});
