// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TrackCreditsEditor } from './TrackCreditsEditor';

describe('TrackCreditsEditor', () => {
  afterEach(cleanup);

  it('offers Add credit on the empty state only', () => {
    const onChange = vi.fn();
    render(<TrackCreditsEditor value={[]} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /Extra credits/ }));
    const add = screen.getAllByRole('button', { name: /Add credit/ });
    expect(add).toHaveLength(1);
    fireEvent.click(add[0]);
    expect(onChange).toHaveBeenCalledWith([{ role: 'writer', name: '' }]);
  });

  it('keeps Add credit under the list once credits exist', () => {
    render(
      <TrackCreditsEditor
        value={[{ role: 'writer', name: 'Aino' }]}
        onChange={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Extra credits/ }));
    expect(screen.getAllByRole('button', { name: /Add credit/ })).toHaveLength(
      1,
    );
  });
});
