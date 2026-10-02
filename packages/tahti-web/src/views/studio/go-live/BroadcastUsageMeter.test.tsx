// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import type { BroadcastUsage } from '../../../api/broadcast';
import { useSettingsModalStore } from '../../../stores/settingsModalStore';
import { BroadcastUsageMeter, formatLiveTime } from './BroadcastUsageMeter';

const BASE: BroadcastUsage = {
  tier: 'FREE',
  unlimited: false,
  secondsUsed: 12 * 60,
  secondsRemaining: 48 * 60,
  weeklyCapSeconds: 60 * 60,
  graceSeconds: 60,
  warnings: [],
  warningLevel: 'none',
  inGrace: false,
  atCap: false,
  blocked: false,
  showUpgradeCta: false,
};

describe('formatLiveTime', () => {
  it('formats hours and minutes compactly', () => {
    expect(formatLiveTime(0)).toBe('0m');
    expect(formatLiveTime(12 * 60 + 30)).toBe('12m');
    expect(formatLiveTime(3600)).toBe('1h');
    expect(formatLiveTime(2 * 3600 + 10 * 60)).toBe('2h 10m');
  });
});

describe('BroadcastUsageMeter', () => {
  afterEach(() => {
    cleanup();
    useSettingsModalStore.setState({ isOpen: false, activeTab: 'account' });
  });

  it('renders nothing on unlimited tiers', () => {
    render(
      <BroadcastUsageMeter
        usage={{ ...BASE, unlimited: true, secondsRemaining: null }}
      />,
    );
    expect(screen.queryByTestId('broadcast-usage')).toBeNull();
  });

  it('shows used-of-cap with a meter and no warning when under the thresholds', () => {
    render(<BroadcastUsageMeter usage={BASE} />);
    expect(screen.getByText('12m of 1h used this week')).toBeTruthy();
    const meter = screen.getByRole('meter');
    expect(meter.getAttribute('aria-valuenow')).toBe(String(12 * 60));
    expect(meter.getAttribute('aria-valuemax')).toBe('3600');
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('warns with the time left at the 55 minute threshold', () => {
    render(
      <BroadcastUsageMeter
        usage={{
          ...BASE,
          secondsUsed: 55 * 60,
          secondsRemaining: 5 * 60,
          warnings: ['2700', '3300'],
          warningLevel: '55m',
        }}
      />,
    );
    expect(screen.getByRole('status').textContent).toContain(
      'Only 5m of live time left this week.',
    );
  });

  it('explains the grace period', () => {
    render(
      <BroadcastUsageMeter
        usage={{
          ...BASE,
          secondsUsed: 3610,
          secondsRemaining: 0,
          warningLevel: 'grace',
          inGrace: true,
          atCap: true,
        }}
      />,
    );
    expect(screen.getByRole('alert').textContent).toContain(
      'about 60 seconds left',
    );
  });

  it('shows the blocked state and opens membership settings from the upgrade link', () => {
    render(
      <BroadcastUsageMeter
        usage={{
          ...BASE,
          secondsUsed: 3660,
          secondsRemaining: 0,
          warningLevel: 'blocked',
          atCap: true,
          blocked: true,
          showUpgradeCta: true,
        }}
      />,
    );
    expect(screen.getByRole('alert').textContent).toContain(
      'used up. It resets Monday 00:00 UTC.',
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Get unlimited live time' }),
    );
    const state = useSettingsModalStore.getState();
    expect(state.isOpen).toBe(true);
    expect(state.activeTab).toBe('account');
  });
});
