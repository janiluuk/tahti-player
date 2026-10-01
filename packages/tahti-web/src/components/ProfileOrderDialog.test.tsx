import { act, fireEvent, render, screen } from '@testing-library/react';
import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ProfileOrderDialog } from './ProfileOrderDialog';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const ITEMS = [
  { id: 'a', title: 'Alpha' },
  { id: 'b', title: 'Beta' },
  { id: 'c', title: 'Gamma' },
];

async function renderDialog(
  save = vi.fn().mockResolvedValue({ ok: true }),
  onClose = vi.fn(),
) {
  await act(async () => {
    render(
      <ProfileOrderDialog
        isOpen
        title="Track order"
        description="d"
        empty="Nothing here."
        load={() => Promise.resolve(ITEMS)}
        save={save}
        onClose={onClose}
      />,
    );
  });
  return { save, onClose };
}

const titles = () =>
  screen
    .getAllByRole('listitem')
    .map((li) => li.textContent?.replace(/^\d+\./, '').trim());

describe('ProfileOrderDialog', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('moves items and saves the new order', async () => {
    const { save, onClose } = await renderDialog();
    fireEvent.click(screen.getByRole('button', { name: 'Move Gamma up' }));
    fireEvent.click(screen.getByRole('button', { name: 'Move Alpha down' }));
    expect(titles()).toEqual(['Gamma', 'Alpha', 'Beta']);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Save order/ }));
    });
    expect(save).toHaveBeenCalledWith(['c', 'a', 'b']);
    expect(onClose).toHaveBeenCalled();
  });

  it('keeps the dialog open and toasts when saving fails', async () => {
    const { onClose } = await renderDialog(
      vi.fn().mockResolvedValue({ ok: false, error: 'ids array is required' }),
    );
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Save order/ }));
    });
    expect(toast.error).toHaveBeenCalledWith('ids array is required');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('disables moving past either end', async () => {
    await renderDialog();
    expect(
      (
        screen.getByRole('button', {
          name: 'Move Alpha up',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(
      (
        screen.getByRole('button', {
          name: 'Move Gamma down',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });
});
