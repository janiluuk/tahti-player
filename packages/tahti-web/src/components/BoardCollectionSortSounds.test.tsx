import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BoardCollectionSortSounds } from './BoardCollectionSortSounds';

const api = vi.hoisted(() => ({
  fetchAdminCollection: vi.fn(),
  reorderAdminCollectionItems: vi.fn(),
}));

vi.mock('../api/admin/admin-collections', () => api);

const item = (id: string, position: number, title: string) => ({
  id,
  position,
  sound: { id: `s-${id}`, title },
});

describe('BoardCollectionSortSounds', () => {
  beforeEach(() => {
    api.fetchAdminCollection.mockReset();
    api.reorderAdminCollectionItems.mockReset();
  });

  it('renders nothing for an album with fewer than two tracks', async () => {
    api.fetchAdminCollection.mockResolvedValue({
      ok: true,
      data: { slug: 'ep', name: 'EP', items: [item('a', 1, 'Only')] },
    });
    const { container } = render(
      <BoardCollectionSortSounds slug="ep" onSaved={vi.fn()} />,
    );
    await waitFor(() =>
      expect(api.fetchAdminCollection).toHaveBeenCalledWith('ep'),
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('saves the order through the board route, every item once', async () => {
    api.fetchAdminCollection.mockResolvedValue({
      ok: true,
      data: {
        slug: 'euphorizer-lp',
        name: 'Euphorizer LP',
        trackSortMode: 'MANUAL',
        items: [item('b', 2, 'Second'), item('a', 1, 'First')],
      },
    });
    api.reorderAdminCollectionItems.mockResolvedValue({ ok: true });
    const onSaved = vi.fn();
    render(
      <BoardCollectionSortSounds slug="euphorizer-lp" onSaved={onSaved} />,
    );
    fireEvent.click(
      await screen.findByRole('button', { name: 'Sort tracks (board)' }),
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Save order' }));
    await waitFor(() =>
      expect(api.reorderAdminCollectionItems).toHaveBeenCalledWith(
        'euphorizer-lp',
        ['a', 'b'],
      ),
    );
    expect(onSaved).toHaveBeenCalled();
  });
});
