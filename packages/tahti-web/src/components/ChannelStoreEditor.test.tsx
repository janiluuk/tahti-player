// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as purchaseTiers from '../api/purchase-tiers';
import * as studio from '../api/studio';
import type { StudioSound } from '../api/studio-types';
import { ChannelStoreEditor } from './ChannelStoreEditor';

const sound = {
  id: 'sound-1',
  title: 'Night drive',
  status: 'READY',
  isPublic: true,
  accessMode: 'FREE',
  purchaseTierId: null,
} as StudioSound;

describe('ChannelStoreEditor', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('tells you the three steps before anything is for sale', async () => {
    vi.spyOn(purchaseTiers, 'fetchStoreSettings').mockResolvedValue({
      ok: true,
      storeEnabled: false,
    });
    vi.spyOn(purchaseTiers, 'fetchMyPurchaseTiers').mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    });
    vi.spyOn(studio, 'fetchStudioSounds').mockResolvedValue({
      data: [sound],
      meta: { source: 'api' },
    });
    render(<ChannelStoreEditor />);
    expect(
      await screen.findByText(/It stays hidden on your channel page/),
    ).toBeTruthy();
    expect(
      screen.getByText(/That is what a fan pays for a track/),
    ).toBeTruthy();
    expect(screen.getByText(/Each track you price shows up/)).toBeTruthy();
    expect(await screen.findByText('Add a price first')).toBeTruthy();
  });

  it('puts a track in the store when you pick a price', async () => {
    vi.spyOn(purchaseTiers, 'fetchStoreSettings').mockResolvedValue({
      ok: true,
      storeEnabled: true,
    });
    vi.spyOn(purchaseTiers, 'fetchMyPurchaseTiers').mockResolvedValue({
      data: [
        {
          id: 'tier-1',
          name: 'Single',
          description: null,
          priceCents: 300,
          priceOptional: false,
          active: true,
          position: 0,
        },
      ],
      meta: { source: 'api' },
    });
    vi.spyOn(studio, 'fetchStudioSounds').mockResolvedValue({
      data: [sound],
      meta: { source: 'api' },
    });
    const save = vi
      .spyOn(purchaseTiers, 'setSoundAccess')
      .mockResolvedValue({ ok: true });
    render(<ChannelStoreEditor />);
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Store price for Night drive',
      }),
    );
    fireEvent.click(await screen.findByRole('option', { name: 'Single — €3' }));
    await vi.waitFor(() =>
      expect(save).toHaveBeenCalledWith('sound-1', {
        accessMode: 'PURCHASE',
        purchaseTierId: 'tier-1',
      }),
    );
    expect(
      await screen.findByText(/In the Store now: Night drive/),
    ).toBeTruthy();
  });
});
