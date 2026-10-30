import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { addMikseriTrack } from '../../../api/sources';
import { MikseriImportPanel } from './MikseriImportPanel';

vi.mock('../../../api/sources', () => ({
  addMikseriTrack: vi.fn(),
}));

describe('MikseriImportPanel', () => {
  it('adds a validated, rights-confirmed track reference', async () => {
    vi.mocked(addMikseriTrack).mockResolvedValue({
      ok: true,
      data: { soundId: 's1', embedUrl: 'https://mikseri.net/embed/' },
    });
    const onAdded = vi.fn();
    render(
      <MikseriImportPanel
        collectionId="c1"
        onAdded={onAdded}
        onUndoAdd={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('Mikseri track'), {
      target: { value: '635878' },
    });
    fireEvent.change(screen.getByLabelText('Track title'), {
      target: { value: 'Demo song' },
    });
    fireEvent.change(screen.getByLabelText('Artist name'), {
      target: { value: 'Demo artist' },
    });
    fireEvent.click(screen.getByLabelText('Rights confirmed'));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Add embed' }));
    });

    expect(addMikseriTrack).toHaveBeenCalledWith({
      collectionId: 'c1',
      trackUrl: '635878',
      title: 'Demo song',
      artistName: 'Demo artist',
      genre: undefined,
      rightsConfirmed: true,
    });
    expect(onAdded).toHaveBeenCalledOnce();
  });

  it('rejects a playlist URL as a collection track', async () => {
    render(
      <MikseriImportPanel
        collectionId="c1"
        onAdded={vi.fn()}
        onUndoAdd={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText('Mikseri track'), {
      target: {
        value: 'https://mikseri.net/embed/?type=2&parameter=playlist',
      },
    });
    fireEvent.change(screen.getByLabelText('Track title'), {
      target: { value: 'Playlist' },
    });
    fireEvent.change(screen.getByLabelText('Artist name'), {
      target: { value: 'Artist' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Add embed' }));
    });
    expect(screen.getByRole('alert').textContent).toContain(
      'Paste a Mikseri track page',
    );
  });
});
