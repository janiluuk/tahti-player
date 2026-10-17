import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as agenda from '../../../../api/admin/admin-governance-agenda';
import { AgendaItemsPanel } from './AgendaItemsPanel';

describe('AgendaItemsPanel', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lists the agenda in order once opened', async () => {
    const fetchItems = vi
      .spyOn(agenda, 'fetchAdminAgendaItems')
      .mockResolvedValue({
        ok: true,
        data: [
          ...agenda.mockAgendaItems('meeting-mock-1'),
          {
            id: 'agenda-3',
            meetingId: 'meeting-mock-1',
            position: 3,
            title: 'Board election',
            description: null,
            outcome: 'Liis Kask elected',
          },
        ],
      });
    render(<AgendaItemsPanel meetingId="meeting-mock-1" />);
    expect(fetchItems).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /Agenda items/ }));
    expect(
      await screen.findByText('2. Annual report 2025'),
    ).toBeInTheDocument();
    expect(screen.getByText('Decided: Liis Kask elected')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Agenda items (3)' }),
    ).toBeInTheDocument();
  });

  it('shows why the agenda could not be loaded', async () => {
    vi.spyOn(agenda, 'fetchAdminAgendaItems').mockResolvedValue({
      ok: false,
      error: 'Meeting not found',
    });
    render(<AgendaItemsPanel meetingId="nope" />);
    fireEvent.click(screen.getByRole('button', { name: /Agenda items/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Meeting not found',
    );
  });

  it('adds an item at the end and reloads', async () => {
    const fetchItems = vi
      .spyOn(agenda, 'fetchAdminAgendaItems')
      .mockResolvedValue({ ok: true, data: [] });
    const create = vi
      .spyOn(agenda, 'createAdminAgendaItem')
      .mockResolvedValue({ ok: true });
    render(<AgendaItemsPanel meetingId="m1" />);
    fireEvent.click(screen.getByRole('button', { name: /Agenda items/ }));
    await screen.findByText('No agenda items yet.');
    fireEvent.change(screen.getByLabelText('New item'), {
      target: { value: 'Membership fee 2027' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add to the agenda' }));
    expect(create).toHaveBeenCalledWith('m1', {
      title: 'Membership fee 2027',
      description: '',
    });
    await waitFor(() => expect(fetchItems).toHaveBeenCalledTimes(2));
  });
});
