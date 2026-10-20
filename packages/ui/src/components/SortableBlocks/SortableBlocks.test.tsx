import { render, screen } from '@testing-library/react';
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

  it('keeps block content mounted when reordering is toggled', () => {
    const { rerender } = render(
      <SortableBlocks blocks={blocks} reordering={false} onReorder={vi.fn()} />,
    );
    rerender(<SortableBlocks blocks={blocks} reordering onReorder={vi.fn()} />);
    rerender(
      <SortableBlocks blocks={blocks} reordering={false} onReorder={vi.fn()} />,
    );
    expect(mounts).toHaveBeenCalledTimes(2);
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
