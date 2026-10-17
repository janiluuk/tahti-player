import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as agenda from '../../../../api/admin/admin-governance-agenda';
import { AgendaItemRow } from './AgendaItemRow';

const item = agenda.mockAgendaItems('meeting-mock-1')[1]!;

describe('AgendaItemRow', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('records the outcome and clears an emptied description', async () => {
    const update = vi
      .spyOn(agenda, 'updateAdminAgendaItem')
      .mockResolvedValue({ ok: true });
    const onChanged = vi.fn();
    render(
      <ul>
        <AgendaItemRow item={item} onChanged={onChanged} />
      </ul>,
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Edit item 2: Annual report 2025' }),
    );
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: '' },
    });
    fireEvent.change(screen.getByLabelText('What the meeting decided'), {
      target: { value: 'Approved unanimously' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save item' }));
    expect(update).toHaveBeenCalledWith(item, {
      title: 'Annual report 2025',
      description: null,
      outcome: 'Approved unanimously',
    });
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
  });

  it("shows the API's refusal", async () => {
    vi.spyOn(agenda, 'updateAdminAgendaItem').mockResolvedValue({
      ok: false,
      error: 'Give the item a title',
    });
    render(
      <ul>
        <AgendaItemRow item={item} onChanged={vi.fn()} />
      </ul>,
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Edit item 2: Annual report 2025' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save item' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Give the item a title',
    );
  });

  it('removes an item after confirming, or says why it cannot', async () => {
    const remove = vi.spyOn(agenda, 'deleteAdminAgendaItem').mockResolvedValue({
      ok: false,
      error: 'Records still point at this agenda item: unlink them first',
    });
    render(
      <ul>
        <AgendaItemRow item={item} onChanged={vi.fn()} />
      </ul>,
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Remove item 2: Annual report 2025' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(remove).toHaveBeenCalledWith(item);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'unlink them first',
    );
  });
});
