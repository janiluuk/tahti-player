// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as admin from '../../../../api/admin';
import { SelectsGenerateDialog } from './SelectsGenerateDialog';

function renderDialog(onGenerated = vi.fn()) {
  render(
    <SelectsGenerateDialog
      isOpen
      rotationSize={24}
      onClose={vi.fn()}
      onGenerated={onGenerated}
    />,
  );
  return onGenerated;
}

describe('SelectsGenerateDialog', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('adds to the end by default and reports how many were added', async () => {
    const generate = vi
      .spyOn(admin, 'generateSelectsRotation')
      .mockResolvedValue({ ok: true, added: 10 });
    const onGenerated = renderDialog();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Add tracks' }));
    });
    expect(generate).toHaveBeenCalledWith('add');
    expect(onGenerated).toHaveBeenCalledWith(
      'Added 10 tracks from the top list.',
    );
  });

  it('warns before replacing and says when nothing new was found', async () => {
    const generate = vi
      .spyOn(admin, 'generateSelectsRotation')
      .mockResolvedValue({ ok: true, added: 0 });
    const onGenerated = renderDialog();
    fireEvent.click(
      screen.getByRole('radio', { name: 'Replace the rotation' }),
    );
    expect(
      screen.getByText('This removes all 24 tracks in the current rotation.'),
    ).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Replace rotation' }));
    });
    expect(generate).toHaveBeenCalledWith('replace');
    expect(onGenerated.mock.calls[0]![0]).toMatch(/No new tracks/);
  });

  it('shows a refusal', async () => {
    vi.spyOn(admin, 'generateSelectsRotation').mockResolvedValue({
      ok: false,
      error: 'Tahti Selects channel not found',
    });
    renderDialog();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Add tracks' }));
    });
    expect(screen.getByRole('alert').textContent).toBe(
      'Tahti Selects channel not found',
    );
  });
});
