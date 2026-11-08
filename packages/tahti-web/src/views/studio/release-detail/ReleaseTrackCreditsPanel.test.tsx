// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as studio from '../../../api/studio';
import { ReleaseTrackCreditsPanel } from './ReleaseTrackCreditsPanel';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const tracks = [
  {
    id: 't1',
    position: 1,
    title: 'Opener',
    credits: [{ role: 'vocals', name: 'Aino' }],
  },
  { id: 't2', position: 2, title: 'Closer', credits: null },
];

describe('ReleaseTrackCreditsPanel', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows each track with its saved credits', () => {
    render(
      <ReleaseTrackCreditsPanel
        releaseId="r1"
        tracks={tracks}
        onTrackCreditsSaved={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('Name for credit 1 on Opener')).toHaveProperty(
      'value',
      'Aino',
    );
    expect(screen.getByText('No credits on this track yet.')).toBeTruthy();
  });

  it('adds the first credit from the empty state', () => {
    render(
      <ReleaseTrackCreditsPanel
        releaseId="r1"
        tracks={[tracks[1]]}
        onTrackCreditsSaved={vi.fn()}
      />,
    );
    expect(screen.getAllByRole('button', { name: /Add credit/ })).toHaveLength(
      1,
    );
    fireEvent.click(screen.getByRole('button', { name: /Add credit/ }));
    expect(screen.getByLabelText('Name for credit 1 on Closer')).toBeTruthy();
    expect(screen.queryByText('No credits on this track yet.')).toBeNull();
    expect(screen.getAllByRole('button', { name: /Add credit/ })).toHaveLength(
      1,
    );
  });

  it('saves the credits added to one track', async () => {
    const patch = vi
      .spyOn(studio, 'patchReleaseTrackCredits')
      .mockResolvedValue({
        ok: true,
        credits: [{ role: 'vocals', name: 'Veikko' }],
      });
    const onSaved = vi.fn();
    render(
      <ReleaseTrackCreditsPanel
        releaseId="r1"
        tracks={tracks}
        onTrackCreditsSaved={onSaved}
      />,
    );
    fireEvent.click(screen.getAllByRole('button', { name: /Add credit/ })[1]!);
    fireEvent.change(screen.getByLabelText('Name for credit 1 on Closer'), {
      target: { value: 'Veikko' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Save credits for Closer' }),
    );
    await vi.waitFor(() =>
      expect(onSaved).toHaveBeenCalledWith('t2', [
        { role: 'vocals', name: 'Veikko' },
      ]),
    );
    expect(patch).toHaveBeenCalledWith('r1', 't2', [
      { role: 'vocals', name: 'Veikko' },
    ]);
  });
});
