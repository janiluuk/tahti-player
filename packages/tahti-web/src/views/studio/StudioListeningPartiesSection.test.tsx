import {
  cleanup,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MOCK_LISTENING_PARTY_IDS } from '../../api/listening-parties-mock';
import { resetMockOverrides } from '../../api/mock-overrides';
import { setMockSessionUser } from '../../api/mock-session';
import { useAuthStore } from '../../stores/authStore';
import { renderWithRouter } from '../../test/renderWithRouter';
import { StudioListeningPartiesSection } from './StudioListeningPartiesSection';
import { StudioListeningPartyFormView } from './StudioListeningPartyFormView';

const ARTIST = {
  id: 'mock-artist-1',
  email: 'artist@tahti.live',
  username: 'northern-lights',
  displayName: 'Northern Lights',
  role: 'ARTIST' as const,
  isMember: true,
  channel: { slug: 'northern-lights', state: 'LIVE' as const },
};

describe('Studio listening parties (offline mock)', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_FORCE_MOCK', '1');
    resetMockOverrides();
    setMockSessionUser(ARTIST);
    useAuthStore.setState({ user: ARTIST, hydrated: true, loading: false });
  });

  afterEach(() => {
    cleanup();
    setMockSessionUser(null);
    useAuthStore.setState({ user: null });
    vi.unstubAllEnvs();
  });

  it('lists upcoming parties with reschedule and cancel only before the start', async () => {
    await renderWithRouter(<StudioListeningPartiesSection />);
    const rows = await screen.findAllByRole('listitem');
    expect(rows).toHaveLength(2);
    const [live, scheduled] = rows;
    expect(within(live!).getByText('Live')).toBeTruthy();
    expect(within(live!).queryByText('Reschedule')).toBeNull();
    expect(
      within(scheduled!).getByRole('link', { name: /Reschedule/ }),
    ).toHaveAttribute(
      'href',
      `/studio/listening-parties/${MOCK_LISTENING_PARTY_IDS.scheduled}/edit`,
    );
  });

  it('shows how many people asked for a reminder on a scheduled party', async () => {
    await renderWithRouter(<StudioListeningPartiesSection />);
    const rows = await screen.findAllByRole('listitem');
    const [live, scheduled] = rows;
    expect(await within(scheduled!).findByText('12 reminders')).toBeTruthy();
    expect(within(live!).queryByText(/reminder/)).toBeNull();
  });

  it('cancels a scheduled party after confirming', async () => {
    await renderWithRouter(<StudioListeningPartiesSection />);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Cancel Polar Static' }),
    );
    const confirmCancel = await screen.findByRole('button', {
      name: 'Cancel party',
    });
    expect(confirmCancel.className).toContain('bg-accent-red');
    fireEvent.click(confirmCancel);
    await waitFor(() =>
      expect(screen.getAllByRole('listitem')).toHaveLength(1),
    );
    expect(
      screen.queryByRole('button', { name: 'Cancel Polar Static' }),
    ).toBeNull();
  });

  it('prefills the reschedule form from the party', async () => {
    await renderWithRouter(
      <StudioListeningPartyFormView
        partyId={MOCK_LISTENING_PARTY_IDS.scheduled}
      />,
    );
    expect(await screen.findByText('Polar Static')).toBeTruthy();
    expect(
      (
        screen.getByLabelText(
          'Note to listeners (optional)',
        ) as HTMLTextAreaElement
      ).value,
    ).toMatch(/Grab headphones/);
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeTruthy();
  });

  it('refuses a start time under five minutes away', async () => {
    await renderWithRouter(
      <StudioListeningPartyFormView releaseId="rel-mock-1" />,
    );
    const start = await screen.findByLabelText('Starts');
    const soon = new Date(Date.now() + 60_000);
    const pad = (n: number) => String(n).padStart(2, '0');
    fireEvent.change(start, {
      target: {
        value: `${soon.getFullYear()}-${pad(soon.getMonth() + 1)}-${pad(soon.getDate())}T${pad(soon.getHours())}:${pad(soon.getMinutes())}`,
      },
    });
    expect(screen.getByText('Start at least 5 minutes from now.')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Schedule party' }),
    ).toBeDisabled();
  });
});
