// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { i18n } from '@tahti-player/i18n';

import { GoLiveHeader, startBlockedReason } from './GoLiveHeader';
import type { GoLiveStepId } from './goLiveSteps';

const toastSuccess = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: vi.fn(),
  },
}));

const t = i18n.getFixedT('en_US', 'web');

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderHeader(
  overrides: Partial<Parameters<typeof GoLiveHeader>[0]> = {},
) {
  const props = {
    status: 'offline' as const,
    liveSince: null,
    reconnectDeadline: null,
    missing: [] as GoLiveStepId[],
    usageBlocked: false,
    onAir: false,
    busy: false,
    slug: 'artist',
    onStart: vi.fn(),
    onEnd: vi.fn(),
    onHelp: vi.fn(),
    ...overrides,
  };
  render(<GoLiveHeader {...props} />);
  return props;
}

describe('startBlockedReason', () => {
  it('lists the missing required steps', () => {
    expect(startBlockedReason(t, ['show-info'], false)).toBe(
      'To start, add a show name.',
    );
    expect(startBlockedReason(t, ['show-info', 'encoder'], false)).toBe(
      'To start, add a show name and connect your encoder.',
    );
    expect(startBlockedReason(t, [], true)).toMatch(/used up/);
    expect(startBlockedReason(t, [], false)).toBeNull();
  });
});

describe('GoLiveHeader', () => {
  it('keeps a blocked Start broadcast focusable and explains why', () => {
    const props = renderHeader({ missing: ['encoder'] });
    const start = screen.getByRole('button', { name: 'Start broadcast' });
    expect(start).not.toBeDisabled();
    expect(start).toHaveAttribute('aria-disabled', 'true');
    expect(
      document.getElementById(start.getAttribute('aria-describedby') ?? ''),
    ).toHaveTextContent('To start, connect your encoder.');
    fireEvent.click(start);
    expect(props.onStart).not.toHaveBeenCalled();
  });

  it('starts when nothing is missing', () => {
    const props = renderHeader({ status: 'ready' });
    const start = screen.getByRole('button', { name: 'Start broadcast' });
    expect(start).not.toHaveAttribute('aria-disabled');
    expect(start.className).toContain('bg-primary');
    fireEvent.click(start);
    expect(props.onStart).toHaveBeenCalledTimes(1);
  });

  it('swaps to a neutral End broadcast while on air', () => {
    const props = renderHeader({ status: 'live', onAir: true });
    expect(
      screen.queryByRole('button', { name: 'Start broadcast' }),
    ).toBeNull();
    const end = screen.getByRole('button', { name: 'End broadcast' });
    expect(end.className).not.toContain('bg-primary');
    fireEvent.click(end);
    expect(props.onEnd).toHaveBeenCalledTimes(1);
  });

  it('has labelled 44px Help and Share buttons; Share copies the channel link', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    const props = renderHeader();

    const help = screen.getByRole('button', { name: 'How broadcasting works' });
    const share = screen.getByRole('button', { name: 'Copy channel link' });
    expect(help.className).toContain('size-11');
    expect(share.className).toContain('size-11');

    fireEvent.click(help);
    expect(props.onHelp).toHaveBeenCalledTimes(1);

    await act(async () => fireEvent.click(share));
    expect(writeText).toHaveBeenCalledWith(
      `${window.location.origin}/channel/artist`,
    );
    expect(toastSuccess).toHaveBeenCalledWith('Channel link copied.');
  });
});
