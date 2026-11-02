import type { Meta, StoryObj } from '@storybook/react-vite';
import { CollectionPlayerWidget } from '@tahti-web/components/CollectionPlayerWidget';
import { usePlayerStore } from '@tahti-web/stores/playerStore';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import {
  withMockAuth,
  withPageSurface,
  withTahtiRouter,
} from './_lib/decorators';

const meta: Meta<typeof CollectionPlayerWidget> = {
  title: 'Tahti/Collections/CollectionPlayerWidget',
  component: CollectionPlayerWidget,
  args: { slug: 'late-night-selects', kindLabel: 'Set' },
  parameters: {
    docs: {
      description: {
        component:
          'Connected collection widget: loads a public collection, plays all of it or one row through the Tahti player, highlights the playing row, and links to the collection page. The owner gets an edit button.',
      },
    },
  },
  decorators: [withPageSurface(), withMockAuth(null), withTahtiRouter('/')],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const rows = await canvas.findAllByTestId('collection-player-row');
    await userEvent.click(rows[1]);
    await waitFor(() =>
      expect(usePlayerStore.getState().currentId).not.toBeNull(),
    );
    await waitFor(() =>
      expect(canvas.getAllByTestId('collection-player-row')[1]).toHaveAttribute(
        'aria-current',
        'true',
      ),
    );
  },
};
