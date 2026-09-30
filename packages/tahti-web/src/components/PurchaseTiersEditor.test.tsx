// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as purchaseTiers from '../api/purchase-tiers';
import { PurchaseTiersEditor } from './PurchaseTiersEditor';

describe('PurchaseTiersEditor store section', () => {
  beforeEach(() => {
    vi.spyOn(purchaseTiers, 'fetchMyPurchaseTiers').mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows whether the store section is on', async () => {
    vi.spyOn(purchaseTiers, 'fetchStoreSettings').mockResolvedValue({
      ok: true,
      storeEnabled: true,
    });
    render(<PurchaseTiersEditor />);
    const toggle = await screen.findByRole('switch', {
      name: 'Show a Store section on your artist page',
    });
    expect(toggle.getAttribute('aria-checked')).toBe('true');
  });

  it('turns the store section on', async () => {
    vi.spyOn(purchaseTiers, 'fetchStoreSettings').mockResolvedValue({
      ok: true,
      storeEnabled: false,
    });
    const save = vi
      .spyOn(purchaseTiers, 'setStoreEnabled')
      .mockResolvedValue({ ok: true, storeEnabled: true });
    render(<PurchaseTiersEditor />);
    const toggle = await screen.findByRole('switch', {
      name: 'Show a Store section on your artist page',
    });
    fireEvent.click(toggle);
    expect(save).toHaveBeenCalledWith(true);
    await vi.waitFor(() =>
      expect(toggle.getAttribute('aria-checked')).toBe('true'),
    );
  });

  it('hides the toggle when the setting cannot be loaded', async () => {
    const load = vi
      .spyOn(purchaseTiers, 'fetchStoreSettings')
      .mockResolvedValue({ ok: false, error: 'Channel not found' });
    render(<PurchaseTiersEditor />);
    await vi.waitFor(() => expect(load).toHaveBeenCalled());
    expect(screen.queryByRole('switch')).toBeNull();
  });
});
