import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as agenda from '../../api/governance-meeting-agenda';
import * as link from '../../api/governance-motion-meeting';
import type { GovernanceMotionDetail } from '../../api/types';
import { MotionAgendaItemControl } from './MotionAgendaItemControl';

const motion = {
  id: 'm1',
  title: 'Approve the annual report',
  description: 'Text',
  state: 'OPEN',
  meeting: { id: 'meeting-1', title: 'June board meeting', scheduledAt: null },
  agendaItem: { id: 'agenda-2', position: 2, title: 'Annual report 2025' },
} as unknown as GovernanceMotionDetail;

describe('MotionAgendaItemControl', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('saves the chosen item', async () => {
    vi.spyOn(agenda, 'fetchMeetingAgenda').mockResolvedValue({
      data: agenda.mockMeetingAgenda('meeting-board-2026-06'),
      meta: { source: 'api' },
    });
    const save = vi
      .spyOn(link, 'linkMotionAgendaItem')
      .mockResolvedValue({ ok: true });
    const onChanged = vi.fn();
    render(<MotionAgendaItemControl motion={motion} onChanged={onChanged} />);
    fireEvent.click(screen.getByRole('button', { name: 'Change agenda item' }));
    const saveButton = screen.getByRole('button', { name: 'Save agenda item' });
    await waitFor(() => expect(saveButton).toBeEnabled());
    fireEvent.click(saveButton);
    expect(save).toHaveBeenCalledWith('m1', 'agenda-2');
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
  });

  it('points at the AGM tab when the meeting has no items', async () => {
    vi.spyOn(agenda, 'fetchMeetingAgenda').mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    });
    render(<MotionAgendaItemControl motion={motion} onChanged={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Change agenda item' }));
    expect(
      await screen.findByText(/That meeting has no agenda items yet/),
    ).toBeInTheDocument();
  });

  it('offers nothing without a meeting', () => {
    const { container } = render(
      <MotionAgendaItemControl
        motion={{ ...motion, meeting: null, agendaItem: null }}
        onChanged={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
