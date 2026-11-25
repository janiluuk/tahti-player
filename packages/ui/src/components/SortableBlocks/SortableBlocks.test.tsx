import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { useEffect } from 'react';

import { SortableBlocks, type SortableBlock } from './SortableBlocks';

const mounts = vi.fn();

function Probe({ name }: { name: string }) {
  useEffect(() => {
    mounts(name);
  }, [name]);
  return <p>{name} content</p>;
}

const blocks: SortableBlock[] = [
  { id: 'radio', label: 'Radio', content: <Probe name="radio" /> },
  { id: 'news', label: 'News', content: <Probe name="news" /> },
];

describe('SortableBlocks', () => {
  beforeEach(() => mounts.mockClear());

  it('renders a plain stack without handles when not reordering', () => {
    render(
      <SortableBlocks blocks={blocks} reordering={false} onReorder={vi.fn()} />,
    );
    expect(screen.getByText('radio content')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Move Radio' })).toBeNull();
  });

  it('shows a labelled drag handle per block while reordering', () => {
    render(<SortableBlocks blocks={blocks} reordering onReorder={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: 'Move Radio' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Move News' }),
    ).toBeInTheDocument();
  });

  it('keeps block content mounted when reordering is toggled after the drag layer loaded', async () => {
    const { container, rerender } = render(
      <SortableBlocks blocks={blocks} reordering onReorder={vi.fn()} />,
    );
    await waitFor(() =>
      expect(container.querySelector('[data-drag-ready]')).not.toBeNull(),
    );
    // The drag layer's own mount effects can still be pending when its DOM
    // shows up; flush them so only the toggles below are counted.
    await act(async () => {});
    mounts.mockClear();
    rerender(
      <SortableBlocks blocks={blocks} reordering={false} onReorder={vi.fn()} />,
    );
    rerender(<SortableBlocks blocks={blocks} reordering onReorder={vi.fn()} />);
    expect(mounts).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Move Radio' })).toHaveAttribute(
      'aria-roledescription',
      'sortable',
    );
  });

  it('keeps dnd-kit out of a stack that never reorders', async () => {
    const { container } = render(
      <SortableBlocks blocks={blocks} reordering={false} onReorder={vi.fn()} />,
    );
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(container.querySelector('[data-drag-ready]')).toBeNull();
    expect(mounts).toHaveBeenCalledTimes(2);
  });

  it('offers remove only while reordering', () => {
    const onRemove = vi.fn();
    const { rerender } = render(
      <SortableBlocks
        blocks={blocks}
        reordering={false}
        onReorder={vi.fn()}
        onRemove={onRemove}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Remove Radio' })).toBeNull();
    rerender(
      <SortableBlocks
        blocks={blocks}
        reordering
        onReorder={vi.fn()}
        onRemove={onRemove}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Remove News' }));
    expect(onRemove).toHaveBeenCalledWith('news');
  });

  it('uses a custom move label', () => {
    render(
      <SortableBlocks
        blocks={blocks}
        reordering
        onReorder={vi.fn()}
        moveLabel={(label) => `Drag ${label}`}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Drag News' }),
    ).toBeInTheDocument();
  });
});
