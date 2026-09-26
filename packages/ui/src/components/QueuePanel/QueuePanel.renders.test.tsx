import { fireEvent, render, screen, within } from '@testing-library/react';
import { FC } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { QueueItem as QueueItemType } from '@tahti-player/model';

import type { QueueItemProps } from '../QueueItem/types';
import { QueuePanel, resolveReorder } from './QueuePanel';

const renderCounts = new Map<string, number>();

vi.mock('../QueueItem', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../QueueItem')>();
  const CountingQueueItem: FC<QueueItemProps> = (props) => {
    const id = props.track.source.id;
    renderCounts.set(id, (renderCounts.get(id) ?? 0) + 1);
    return <actual.QueueItem {...props} />;
  };
  return { ...actual, QueueItem: CountingQueueItem };
});

const makeItem = (id: string): QueueItemType => ({
  id,
  track: {
    title: `Track ${id}`,
    artists: [{ name: 'Artist', roles: ['primary'] }],
    durationMs: 1000,
    source: { provider: 'test', id },
  },
  status: 'idle',
  addedAtIso: '2026-01-01T00:00:00.000Z',
});

const items = ['a', 'b', 'c', 'd'].map(makeItem);

type Harness = {
  items?: QueueItemType[];
  currentItemId?: string;
  liked?: Set<string>;
  onToggleLike?: (id: string) => void;
  onRemoveItem?: (id: string) => void;
  onSelectItem?: (id: string) => void;
  unrelated?: number;
  reorderable?: boolean;
};

/** Mirrors a connected parent: fresh inline callbacks and labels every render. */
const Parent: FC<Harness> = ({
  items: rows = items,
  currentItemId,
  liked = new Set(),
  onToggleLike = () => {},
  onRemoveItem = () => {},
  onSelectItem = () => {},
  unrelated = 0,
  reorderable = true,
}) => (
  <div data-unrelated={unrelated}>
    <QueuePanel
      items={rows}
      currentItemId={currentItemId}
      fadePastItems
      reorderable={reorderable}
      onReorder={(from, to) => void [from, to]}
      onSelectItem={(id) => onSelectItem(id)}
      onRemoveItem={(id) => onRemoveItem(id)}
      onTitleClick={() => {}}
      isLiked={(id) => liked.has(id)}
      onToggleLike={(id) => onToggleLike(id)}
      labels={{ removeButton: 'Remove', playbackError: 'Error' }}
    />
  </div>
);

const rowTitles = () =>
  screen
    .getAllByTestId('queue-item-title')
    .map((element) => element.textContent);

const rowFor = (id: string) =>
  screen.getByText(`Track ${id}`).closest('[data-testid="queue-item"]');

describe('QueuePanel row rendering', () => {
  beforeEach(() => {
    renderCounts.clear();
  });

  it('does not re-render rows when the parent re-renders with fresh callbacks and labels', () => {
    const { rerender } = render(<Parent currentItemId="b" />);
    renderCounts.clear();

    rerender(<Parent currentItemId="b" unrelated={1} />);
    rerender(<Parent currentItemId="b" unrelated={2} />);

    expect([...renderCounts.values()].reduce((a, b) => a + b, 0)).toBe(0);
  });

  it('re-renders only the toggled row on a favorite change', () => {
    const onToggleLike = vi.fn();
    const { rerender } = render(
      <Parent liked={new Set(['a'])} onToggleLike={onToggleLike} />,
    );
    renderCounts.clear();

    fireEvent.click(
      within(rowFor('c') as HTMLElement).getByTestId('queue-item-like-button'),
    );
    expect(onToggleLike).toHaveBeenCalledWith('c');

    rerender(
      <Parent liked={new Set(['a', 'c'])} onToggleLike={onToggleLike} />,
    );

    expect(Object.fromEntries(renderCounts)).toEqual({ c: 1 });
    expect(
      within(rowFor('c') as HTMLElement).getByTestId('queue-item-like-button'),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      within(rowFor('b') as HTMLElement).getByTestId('queue-item-like-button'),
    ).toHaveAttribute('aria-pressed', 'false');
  });

  it('re-renders only the previous and next current rows when playback advances', () => {
    const { rerender } = render(<Parent currentItemId="a" />);
    renderCounts.clear();

    rerender(<Parent currentItemId="b" />);

    expect(Object.fromEntries(renderCounts)).toEqual({ a: 1, b: 1 });
    expect(rowFor('b')).toHaveAttribute('data-is-current', 'true');
    expect(rowFor('a')).toHaveAttribute('data-is-current', 'false');
  });

  it('calls the latest handler after the parent swaps it without re-rendering rows', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(<Parent onRemoveItem={first} />);
    rerender(<Parent onRemoveItem={second} />);
    renderCounts.clear();

    fireEvent.click(
      within(rowFor('d') as HTMLElement).getByTestId(
        'queue-item-remove-button',
      ),
    );

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith('d');
    expect(renderCounts.size).toBe(0);
  });

  // dnd-kit's SortableContext re-renders every sortable row when the id list
  // changes, so the no-re-render guarantee on remove/reorder only holds for
  // non-reorderable panels (collapsed rail, mobile).
  it.each([true, false])('removes a row (reorderable=%s)', (reorderable) => {
    const { rerender } = render(<Parent reorderable={reorderable} />);
    renderCounts.clear();

    rerender(
      <Parent
        reorderable={reorderable}
        items={items.filter((item) => item.id !== 'b')}
      />,
    );

    expect(rowTitles()).toEqual(['Track a', 'Track c', 'Track d']);
    if (!reorderable) {
      expect(renderCounts.size).toBe(0);
    }
  });

  it.each([true, false])('reorders rows (reorderable=%s)', (reorderable) => {
    const { rerender } = render(<Parent reorderable={reorderable} />);
    renderCounts.clear();

    const [a, b, c, d] = items as [
      QueueItemType,
      QueueItemType,
      QueueItemType,
      QueueItemType,
    ];
    rerender(<Parent reorderable={reorderable} items={[c, a, b, d]} />);

    expect(rowTitles()).toEqual(['Track c', 'Track a', 'Track b', 'Track d']);
    if (!reorderable) {
      expect(renderCounts.size).toBe(0);
    }
  });

  it('selects the clicked row by id', () => {
    const onSelectItem = vi.fn();
    render(<Parent onSelectItem={onSelectItem} />);

    fireEvent.click(rowFor('c') as HTMLElement);

    expect(onSelectItem).toHaveBeenCalledWith('c');
  });
});

describe('resolveReorder', () => {
  const indexById = new Map([
    ['a', 0],
    ['b', 1],
    ['c', 2],
  ]);

  it('maps dragged and target ids to their indices', () => {
    expect(resolveReorder(indexById, 'a', 'c')).toEqual([0, 2]);
    expect(resolveReorder(indexById, 'c', 'a')).toEqual([2, 0]);
  });

  it('ignores drops outside the list, onto itself or on unknown ids', () => {
    expect(resolveReorder(indexById, 'a', undefined)).toBeNull();
    expect(resolveReorder(indexById, 'b', 'b')).toBeNull();
    expect(resolveReorder(indexById, 'a', 'zzz')).toBeNull();
    expect(resolveReorder(indexById, 'zzz', 'a')).toBeNull();
  });
});
