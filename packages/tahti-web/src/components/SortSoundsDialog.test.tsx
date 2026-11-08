// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SortSoundsDialog } from './SortSoundsDialog';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const sounds = [
  { id: 'a', title: 'Beta', date: '2024-01-01', artworkUrl: null },
  { id: 'b', title: 'Alpha', date: '2026-01-01', artworkUrl: null },
  { id: 'c', title: 'Gamma', date: '2025-01-01', artworkUrl: null },
];

const titles = () =>
  screen
    .getAllByTestId('sort-sounds-row')
    .map((row) => within(row).getByText(/^(Alpha|Beta|Gamma)$/).textContent);

function renderDialog(onSave = vi.fn().mockResolvedValue({ ok: true })) {
  render(
    <SortSoundsDialog
      isOpen
      sounds={sounds}
      initialMode="OWN"
      onSave={onSave}
      onClose={vi.fn()}
    />,
  );
  return onSave;
}

describe('SortSoundsDialog', () => {
  afterEach(cleanup);

  it('moves an entry to the top and to the bottom', () => {
    renderDialog();
    fireEvent.click(screen.getByRole('button', { name: 'Move Gamma to top' }));
    expect(titles()).toEqual(['Gamma', 'Beta', 'Alpha']);
    fireEvent.click(
      screen.getByRole('button', { name: 'Move Gamma to bottom' }),
    );
    expect(titles()).toEqual(['Beta', 'Alpha', 'Gamma']);
  });

  it('moves the focused entry with the arrow keys and keeps focus on it', () => {
    renderDialog();
    const handle = screen.getByRole('button', { name: 'Reorder Beta' });
    handle.focus();
    fireEvent.keyDown(handle, { key: 'ArrowDown' });
    expect(titles()).toEqual(['Alpha', 'Beta', 'Gamma']);
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Reorder Beta' }),
    );
    fireEvent.keyDown(document.activeElement!, { key: 'End' });
    expect(titles()).toEqual(['Alpha', 'Gamma', 'Beta']);
    expect(screen.getByText('Beta moved to position 3 of 3')).toBeTruthy();
  });

  it('saves a picked sort with its mode', async () => {
    const onSave = renderDialog();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Sort by/ }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('option', { name: 'Newest first' }));
    });
    expect(titles()).toEqual(['Alpha', 'Gamma', 'Beta']);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save order' }));
    });
    expect(onSave).toHaveBeenCalledWith(['b', 'c', 'a'], 'NEWEST');
  });
});
