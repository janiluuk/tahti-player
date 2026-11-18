import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { FilterBar } from '.';
import { FilterChips } from '../FilterChips';

describe('FilterBar', () => {
  it('(Snapshot) renders search and chips', () => {
    const { container } = render(
      <FilterBar searchValue="" onSearchChange={() => undefined}>
        <FilterChips
          items={[
            { id: 'all', label: 'All' },
            { id: 'live', label: 'Live' },
          ]}
          selected="all"
          onChange={() => undefined}
        />
      </FilterBar>,
    );
    expect(container).toMatchSnapshot();
  });

  it('keeps a search end addon idle until the field has a value', () => {
    const { rerender } = render(
      <FilterBar
        searchValue=""
        onSearchChange={() => undefined}
        searchEndAddon={<span>Clear</span>}
      />,
    );
    const addon = screen.getByText('Clear').parentElement;
    expect(addon?.className).not.toMatch(/text-primary/);
    rerender(
      <FilterBar
        searchValue="beat"
        onSearchChange={() => undefined}
        searchEndAddon={<span>Clear</span>}
        searchEndAddonActive
      />,
    );
    expect(screen.getByText('Clear').parentElement?.className).toMatch(
      /text-primary/,
    );
  });

  it('forwards search typing', async () => {
    const onSearchChange = vi.fn();
    const user = userEvent.setup();
    render(<FilterBar searchValue="" onSearchChange={onSearchChange} />);
    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'a');
    expect(onSearchChange).toHaveBeenCalledWith('a');
  });
});
