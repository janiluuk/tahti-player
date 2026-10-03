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

  it('loads and edits the downloads switch, keeping the gates while on', async () => {
    const setForm = vi.fn();
    await renderTab(
      stateFor({ isPublic: true, downloadsEnabled: true }, setForm),
    );
    const toggle = screen.getByRole('switch', { name: 'Allow downloads' });
    expect(toggle.getAttribute('aria-checked')).toBe('true');
    expect(
      screen.getByRole('switch', { name: 'Require a follow' }),
    ).toBeTruthy();
    fireEvent.click(toggle);
    expect(setForm).toHaveBeenCalledWith({
      isPublic: true,
      downloadsEnabled: false,
    });
  });

  it('hides the follow and share gates when downloads are off', async () => {
    await renderTab(stateFor({ isPublic: true, downloadsEnabled: false }));
    expect(
      screen
        .getByRole('switch', { name: 'Allow downloads' })
        .getAttribute('aria-checked'),
    ).toBe('false');
    expect(
      screen.queryByRole('switch', { name: 'Require a follow' }),
    ).toBeNull();
  });

  it('hides the switch when the API does not report the setting', async () => {
    await renderTab(stateFor({ isPublic: true }));
    expect(
      screen.queryByRole('switch', { name: 'Allow downloads' }),
    ).toBeNull();
    expect(
      screen.getByRole('switch', { name: 'Require a follow' }),
    ).toBeTruthy();
  });
});
