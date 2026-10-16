import type { Meta, StoryObj } from '@storybook/react-vite';
import { GlobalSearch } from '@tahti-web/components/GlobalSearch';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { withTahtiRouter } from './_lib/decorators';
import { mockData } from './_lib/mock-data';

const meta: Meta<NonNullable<Parameters<typeof GlobalSearch>[0]>> = {
  title: 'Tahti/Widgets/GlobalSearch',
  component: GlobalSearch,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/')],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

// GlobalSearch has no controllable props — query/results are entirely
// internal state driven by typing into the input, debounced against the
// mocked search API. A `play` function drives real user input to reach
// the "with results" state, searching for "Northern" which matches the
// mock artist "Northern Lights" in the fixture directory.
export const WithResults: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox');
    await userEvent.click(input);
    await userEvent.type(input, 'Northern', { delay: 30 });
    const listbox = await canvas.findByRole('listbox');
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    await waitFor(() =>
      expect(
        listbox.querySelector('#search-option-artist-northern-lights'),
      ).toBeTruthy(),
    );
  },
};

/** Playlists group when the query matches a Favorites vault (mock search + override). */
export const WithPlaylistResults: Story = {
  parameters: {
    mockData: mockData({
      search: (base, q) => {
        if (base.collections.length > 0) {
          return base;
        }
        const needle = q.trim().toLowerCase();
        if (
          !needle.includes('vault') &&
          !needle.includes('favorites') &&
          !needle.includes('playlist')
        ) {
          return base;
        }
        return {
          ...base,
          collections: [
            {
              slug: 'favorites-vault',
              name: 'Favorites vault',
              coverUrl: null,
              ownerUsername: 'northern-lights',
              ownerDisplayName: 'Northern Lights',
            },
          ],
        };
      },
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox');
    await userEvent.click(input);
    await userEvent.type(input, 'vault', { delay: 30 });
    const listbox = await canvas.findByRole('listbox');
    await waitFor(() => expect(listbox).toHaveTextContent('Playlists'));
    await waitFor(() =>
      expect(
        listbox.querySelector('#search-option-collection-favorites-vault'),
      ).toBeTruthy(),
    );
  },
};
