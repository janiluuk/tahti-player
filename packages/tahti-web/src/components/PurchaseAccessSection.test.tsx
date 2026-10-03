// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as purchaseTiers from '../api/purchase-tiers';
import { PurchaseAccessSection } from './PurchaseAccessSection';

vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  Link: ({ children }: { children: ReactNode }) => <a>{children}</a>,
}));

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
  await act(async () => {
    render(
      <PurchaseAccessSection access={access} onAccessChange={onAccessChange} />,
    );
  });
  return onAccessChange;
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
    const onAccessChange = await renderSection({
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
});
