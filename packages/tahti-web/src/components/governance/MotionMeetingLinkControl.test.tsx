import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as client from '../../api/client';
import * as link from '../../api/governance-motion-meeting';
import type { GovernanceMotionDetail } from '../../api/types';
import { numericDay } from '../../lib/relativeDate';
import { MotionMeetingLinkControl } from './MotionMeetingLinkControl';

const motion = {
  id: 'm1',
  title: 'Adopt the rules',
  description: 'Text',
  state: 'DRAFT',
  meeting: {
    id: 'meeting-agm-2026',
    title: '2026 Annual General Meeting',
    scheduledAt: null,
  },
} as unknown as GovernanceMotionDetail;

describe('MotionMeetingLinkControl', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('saves the chosen meeting', async () => {
    vi.stubEnv('VITE_FORCE_MOCK', '1');
    const save = vi
      .spyOn(link, 'linkMotionMeeting')
      .mockResolvedValue({ ok: true });
    const onChanged = vi.fn();
    render(<MotionMeetingLinkControl motion={motion} onChanged={onChanged} />);
    fireEvent.click(screen.getByRole('button', { name: 'Change meeting' }));
    expect(screen.getByRole('button', { name: /Meeting/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save meeting' }));
    expect(save).toHaveBeenCalledWith('m1', 'meeting-agm-2026');
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
  });

  it("shows the API's refusal", async () => {
    vi.stubEnv('VITE_FORCE_MOCK', '1');
    vi.spyOn(link, 'linkMotionMeeting').mockResolvedValue({
      ok: false,
      error: 'Meeting not found',
    });
    render(
      <MotionMeetingLinkControl
        motion={{ ...motion, meeting: null }}
        onChanged={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Put on a meeting' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save meeting' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Meeting not found',
    );
  });

  it('formats meeting option dates as d.m.yyyy', async () => {
    vi.stubEnv('VITE_FORCE_MOCK', '1');
    const scheduledAt = '2026-11-04T15:00:00.000Z';
    vi.spyOn(client, 'fetchGovernanceMeetings').mockResolvedValue({
      data: [
        {
          id: 'meet-1',
          title: 'Board meeting',
          scheduledAt,
        },
      ],
      meta: { source: 'mock' },
    } as never);
    render(
      <MotionMeetingLinkControl
        motion={{ ...motion, meeting: null }}
        onChanged={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Put on a meeting' }));
    fireEvent.click(await screen.findByRole('button', { name: /Meeting/ }));
    expect(
      await screen.findByRole('option', {
        name: `Board meeting (${numericDay(scheduledAt)})`,
      }),
    ).toBeInTheDocument();
  });
});
