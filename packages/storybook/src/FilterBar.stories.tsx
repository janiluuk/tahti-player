import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';

import { FilterBar, FilterChips, SegmentedControl } from '@tahti-player/ui';

const meta: Meta<typeof FilterBar> = {
  title: 'Components/FilterBar',
  component: FilterBar,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'One toolbar row for list pages: optional search plus filter slots (FilterChips, SegmentedControl, Select). Do not stack multiple toolbars under ViewShell. Missing states: loading / disabled bar.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SearchAndChips: Story = {
  render: function SearchAndChipsStory() {
    const [query, setQuery] = useState('');
    const [kind, setKind] = useState('all');
    return (
      <FilterBar
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search sounds…"
      >
        <FilterChips
          items={[
            { id: 'all', label: 'All' },
            { id: 'draft', label: 'Drafts' },
            { id: 'live', label: 'Live' },
          ]}
          selected={kind}
          onChange={setKind}
        />
      </FilterBar>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const search = canvas.getByRole('searchbox', { name: 'Search' });
    await userEvent.tab();
    await expect(search).toHaveFocus();
    await userEvent.type(search, 'beat');
    await expect(search).toHaveValue('beat');
    await userEvent.click(canvas.getByRole('radio', { name: 'Drafts' }));
    await expect(canvas.getByRole('radio', { name: 'Drafts' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  },
};

export const WithSegmentedControl: Story = {
  render: function WithSegmentStory() {
    const [query, setQuery] = useState('');
    const [view, setView] = useState('list');
    return (
      <FilterBar searchValue={query} onSearchChange={setQuery}>
        <SegmentedControl
          aria-label="View"
          value={view}
          onChange={setView}
          options={[
            { id: 'list', label: 'List' },
            { id: 'grid', label: 'Grid' },
          ]}
        />
      </FilterBar>
    );
  },
};
