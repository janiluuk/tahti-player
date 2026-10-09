// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as purchaseTiers from '../api/purchase-tiers';
import { renderWithRouter } from '../test/renderWithRouter';
import { PurchaseAccessSection } from './PurchaseAccessSection';

const TIER = {
  id: 'tier-1',
  name: 'Album',
  description: null,
  priceCents: 500,
  priceOptional: false,
  active: true,
  position: 0,
};

async function renderSection(
  access: purchaseTiers.SoundAccess,
  onAccessChange = vi.fn(),
) {
  vi.spyOn(purchaseTiers, 'fetchMyPurchaseTiers').mockResolvedValue({
    data: [TIER],
    meta: { source: 'api' },
  });
  const { router } = await renderWithRouter(
    <PurchaseAccessSection access={access} onAccessChange={onAccessChange} />,
    { paths: ['/studio/audience'] },
  );
  return { onAccessChange, router };
}

describe('PurchaseAccessSection', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows a subscribers-only track as such', async () => {
    await renderSection({
      accessMode: 'SUBSCRIBERS_ONLY',
      purchaseTierId: null,
    });
    expect(screen.getByText('Fan subscribers only')).toBeTruthy();
  });

  it('maps the picked option onto accessMode', async () => {
    const { onAccessChange } = await renderSection({
      accessMode: 'FREE',
      purchaseTierId: null,
    });
    fireEvent.click(screen.getByRole('button', { name: 'Access' }));
    fireEvent.click(
      await screen.findByRole('option', { name: 'Fan subscribers only' }),
    );
    expect(onAccessChange).toHaveBeenLastCalledWith({
      accessMode: 'SUBSCRIBERS_ONLY',
      purchaseTierId: null,
    });
    fireEvent.click(screen.getByRole('button', { name: 'Access' }));
    fireEvent.click(await screen.findByRole('option', { name: /Album/ }));
    expect(onAccessChange).toHaveBeenLastCalledWith({
      accessMode: 'PURCHASE',
      purchaseTierId: 'tier-1',
    });
  });

  it('opens the purchase tiers page from the tooltip-wrapped link', async () => {
    const { router } = await renderSection({
      accessMode: 'FREE',
      purchaseTierId: null,
    });
    const link = screen.getByRole('link', { name: 'Manage purchase tiers' });
    expect(link.getAttribute('href')).toBe('/studio/audience');
    expect(link.querySelector('button')).toBeNull();
    fireEvent.click(link);
    expect(await screen.findByTestId('routed-to')).toBeTruthy();
    expect(router.state.location.pathname).toBe('/studio/audience');
  });
});
