// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as agenda from '../../api/governance-meeting-agenda';
import { renderWithRouter } from '../../test/renderWithRouter';
import { MeetingAgendaItems } from './MeetingAgendaItems';

describe('MeetingAgendaItems', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows an error for a non-404 api failure', async () => {
    vi.spyOn(agenda, 'fetchMeetingAgenda').mockResolvedValue({
      data: [],
      meta: { source: 'api', reason: 'HTTP 500' },
    });
    await renderWithRouter(
      <MeetingAgendaItems meetingId="m1" fallback={<p>Free-text agenda</p>} />,
    );
    expect(await screen.findByText('Could not load the agenda')).toBeTruthy();
    expect(screen.getByText('HTTP 500')).toBeTruthy();
    expect(screen.queryByText('Free-text agenda')).toBeNull();
  });

  it('falls back to the free-text agenda on a 404', async () => {
    vi.spyOn(agenda, 'fetchMeetingAgenda').mockResolvedValue({
      data: [],
      meta: { source: 'api', reason: 'HTTP 404' },
    });
    await renderWithRouter(
      <MeetingAgendaItems meetingId="m1" fallback={<p>Free-text agenda</p>} />,
    );
    expect(await screen.findByText('Free-text agenda')).toBeTruthy();
    expect(screen.queryByText('Could not load the agenda')).toBeNull();
  });
});
