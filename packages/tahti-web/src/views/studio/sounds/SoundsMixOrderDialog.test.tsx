import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { suggestSoundMixOrder } from '../../../api/studio/sound-mix-order';
import { SoundsMixOrderDialog } from './SoundsMixOrderDialog';

vi.mock('../../../api/studio/sound-mix-order', () => ({
  suggestSoundMixOrder: vi.fn(),
}));

const IDS = ['a', 'b', 'c'];

describe('SoundsMixOrderDialog', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows the suggested order with key and tempo, and hands it on in that order', async () => {
    vi.mocked(suggestSoundMixOrder).mockResolvedValue({
      ok: true,
      data: {
        items: [
          { id: 'a', title: 'Opener', bpm: 118, key: 'Am', camelot: '8A' },
          { id: 'b', title: 'Lift', bpm: 122, key: '9A', camelot: '9A' },
        ],
        unplaced: [{ id: 'c', title: 'No Key', bpm: 120, key: null }],
      },
    });
    const onUseOrder = vi.fn();
    await act(async () => {
      render(
        <SoundsMixOrderDialog
          isOpen
          soundIds={IDS}
          onClose={vi.fn()}
          onUseOrder={onUseOrder}
        />,
      );
    });
    expect(suggestSoundMixOrder).toHaveBeenCalledWith(IDS);
    const list = await screen.findByRole('list', {
      name: 'Suggested mix order',
    });
    const rows = within(list).getAllByRole('listitem');
    expect(rows[0]!.textContent).toContain('Opener');
    expect(rows[0]!.textContent).toContain('8A · 118 BPM');
    expect(
      screen.getByText('1 track has no key and goes at the end:'),
    ).toBeTruthy();
    fireEvent.click(
      screen.getByRole('button', { name: 'Add to a playlist in this order' }),
    );
    expect(onUseOrder).toHaveBeenCalledWith(['a', 'b', 'c']);
  });

  it('says so when no track has a key', async () => {
    vi.mocked(suggestSoundMixOrder).mockResolvedValue({
      ok: true,
      data: {
        items: [],
        unplaced: IDS.map((id) => ({
          id,
          title: id,
          bpm: null,
          key: null,
        })),
      },
    });
    await act(async () => {
      render(
        <SoundsMixOrderDialog
          isOpen
          soundIds={IDS}
          onClose={vi.fn()}
          onUseOrder={vi.fn()}
        />,
      );
    });
    expect(
      await screen.findByText(/None of these tracks has a key set/),
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Add to a playlist in this order' }),
    ).toBeDisabled();
  });
});
