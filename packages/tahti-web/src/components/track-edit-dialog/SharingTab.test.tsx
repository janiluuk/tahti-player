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

import type { StudioSound } from '../../api/studio-types';
import { SharingTab } from './SharingTab';
import type { TrackEditDialogState } from './useTrackEditDialog';

vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  Link: ({ children }: { children: ReactNode }) => <a>{children}</a>,
}));

vi.mock('../../api/purchase-tiers', () => ({
  fetchMyPurchaseTiers: vi.fn().mockResolvedValue({ data: [] }),
}));

vi.mock('../../api/studio-extras/sound-download-gate', () => ({
  fetchSoundDownloadGateStats: vi.fn().mockResolvedValue({ data: null }),
}));

const ITEM: StudioSound = { id: 's1', title: 'Night Drive', status: 'READY' };

function stateFor(
  form: TrackEditDialogState['form'],
  setForm = vi.fn(),
): TrackEditDialogState {
  return {
    form,
    setForm,
    access: { accessMode: 'FREE', purchaseTierId: null },
    setAccess: vi.fn(),
    isAudioClip: false,
    downloadingEmbed: false,
    downloadHearthisEmbed: vi.fn(),
    radioSubmission: null,
    submittingToRadio: false,
    submitToRadioRotation: vi.fn(),
  } as unknown as TrackEditDialogState;
}

async function renderTab(state: TrackEditDialogState) {
  await act(async () => {
    render(<SharingTab soundId="s1" item={ITEM} state={state} />);
  });
}

describe('SharingTab', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('only offers audiences the API can store', async () => {
    const setForm = vi.fn();
    await renderTab(stateFor({ isPublic: true }, setForm));
    fireEvent.click(screen.getByRole('button', { name: 'Audience' }));
    const options = screen
      .getAllByRole('option')
      .map((option) => option.textContent?.replace('✓', ''));
    expect(options).toEqual(['Public', 'Private - only you and share links']);
    fireEvent.click(screen.getByRole('option', { name: /Private/ }));
    expect(setForm).toHaveBeenCalledWith({ isPublic: false });
    expect(screen.queryByText('Included fan tiers')).toBeNull();
  });

  it('marks the downloads switch as coming soon but keeps the gates', async () => {
    await renderTab(stateFor({ isPublic: true }));
    expect(
      screen.queryByRole('switch', { name: 'Allow downloads' }),
    ).toBeNull();
    expect(screen.getByText('Coming soon')).toBeTruthy();
    expect(screen.getByText('Turning downloads off')).toBeTruthy();
    expect(
      screen.getByRole('switch', { name: 'Require a follow' }),
    ).toBeTruthy();
  });
});
