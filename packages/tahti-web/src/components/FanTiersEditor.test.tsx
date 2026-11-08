// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as fanTiers from '../api/fan-tiers';
import { FanTiersEditor } from './FanTiersEditor';

describe('FanTiersEditor', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('says the tiers failed to load instead of "No tiers yet"', async () => {
    const fetch = vi.spyOn(fanTiers, 'fetchMyFanTiers').mockResolvedValue({
      data: [],
      meta: { source: 'api', reason: 'HTTP 502' },
    });
    render(<FanTiersEditor />);
    expect(
      await screen.findByText('Could not load your fan tiers'),
    ).toBeTruthy();
    expect(screen.queryByText('No tiers yet')).toBeNull();

    fetch.mockResolvedValue({ data: [], meta: { source: 'api' } });
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('No tiers yet')).toBeTruthy();
  });

  it('opens the new tier dialog from the empty state', async () => {
    vi.spyOn(fanTiers, 'fetchMyFanTiers').mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    });
    render(<FanTiersEditor />);
    await screen.findByText('No tiers yet');
    const ctas = screen.getAllByRole('button', { name: 'New tier' });
    expect(ctas).toHaveLength(2);
    fireEvent.click(ctas[1]!);
    expect(
      await screen.findByRole('dialog', { name: 'New tier' }),
    ).toBeTruthy();
  });
});
