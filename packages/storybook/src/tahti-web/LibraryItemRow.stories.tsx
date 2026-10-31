import type { Meta, StoryObj } from '@storybook/react-vite';
import { LibraryItemRow } from '@tahti-web/components/library/LibraryItemRow';
import { expect, within } from 'storybook/test';

import { Button } from '@tahti-player/ui';

const meta = {
  title: 'Tahti/Library/LibraryItemRow',
  component: LibraryItemRow,
  args: {
    title: 'First Light',
    subtitle: 'Album · Published',
    meta: '2 DSP links · 120 views',
  },
} satisfies Meta<typeof LibraryItemRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithDetail: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('First Light')).toBeVisible();
    await expect(canvas.getByText('Album · Published')).toBeVisible();
    await expect(canvas.getByText('2 DSP links · 120 views')).toBeVisible();
  },
};

export const WithActions: Story = {
  args: {
    actions: (
      <Button size="sm" variant="secondary">
        Manage
      </Button>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Manage' })).toBeVisible();
  },
};
