// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as extras from '../../../api/studio-extras';
import { AccountStoragePanel, usedColor } from './AccountStoragePanel';

function mockStorage(data: extras.StorageUsage) {
  vi.spyOn(extras, 'fetchStorageUsage').mockResolvedValue({
    data,
    meta: { source: 'api' },
  });
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('AccountStoragePanel', () => {
  it('shows used vs free as a donut with the percentage in the middle', async () => {
    mockStorage({
      usedBytes: 100 * 1024 ** 2,
      quotaBytes: 400 * 1024 ** 2,
      unlimited: false,
    });
    render(<AccountStoragePanel />);

    const donut = await screen.findByTestId('account-storage-donut');
    expect(donut).toHaveTextContent('25%');
    expect(donut).toHaveAttribute(
      'aria-label',
      '25% of your available storage is in use.',
    );
    expect(screen.getByText('100 MB')).toBeInTheDocument();
    expect(screen.getByText('300 MB')).toBeInTheDocument();
    expect(screen.getByText('400 MB')).toBeInTheDocument();
  });

  it('skips the donut for an unlimited account', async () => {
    mockStorage({
      usedBytes: 5 * 1024 ** 3,
      quotaBytes: null,
      unlimited: true,
    });
    render(<AccountStoragePanel />);

    expect(await screen.findByText('5.0 GB')).toBeInTheDocument();
    expect(screen.queryByTestId('account-storage-donut')).toBeNull();
    expect(screen.getAllByText('Unlimited')).toHaveLength(2);
  });
});

describe('usedColor', () => {
  it('warms up as the quota fills', () => {
    expect(usedColor(40)).toBe('var(--accent-green)');
    expect(usedColor(80)).toBe('var(--accent-yellow)');
    expect(usedColor(95)).toBe('var(--accent-red)');
  });
});
