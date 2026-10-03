import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { withAddedTag } from './TagChipInput';
import { TrackTagInput } from './TrackTagInput';

const limits = { maxCount: 20, maxLength: 40 };

describe('withAddedTag', () => {
  it('appends a trimmed tag cut to the max length', () => {
    expect(withAddedTag(['drone'], '  late night ', limits)).toEqual([
      'drone',
      'late night',
    ]);
    expect(withAddedTag([], 'x'.repeat(50), limits)).toEqual(['x'.repeat(40)]);
  });

  it('ignores blanks, duplicates in another case, and a full list', () => {
    expect(withAddedTag(['drone'], '   ', limits)).toBeNull();
    expect(withAddedTag(['Drone'], 'drone', limits)).toBeNull();
    expect(withAddedTag(['a', 'b'], 'c', { ...limits, maxCount: 2 })).toBe(
      null,
    );
  });
});

describe('TrackTagInput', () => {
  it('removes a chip', () => {
    const onChange = vi.fn();
    render(<TrackTagInput value={['drone', 'dub']} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Remove drone' }));

    expect(onChange).toHaveBeenCalledWith(['dub']);
  });

  it('hides the add field at the 20-tag limit the API enforces', () => {
    const full = Array.from({ length: 20 }, (_, i) => `tag-${i}`);
    render(<TrackTagInput value={full} onChange={vi.fn()} />);

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.getByText('20 / 20')).toBeInTheDocument();
  });

  it('offers the add field below the limit', () => {
    render(<TrackTagInput value={[]} onChange={vi.fn()} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('0 / 20')).toBeInTheDocument();
  });
});
