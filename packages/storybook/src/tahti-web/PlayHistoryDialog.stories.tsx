import type { Meta, StoryObj } from '@storybook/react-vite';
import { PlayHistoryDialog } from '@tahti-web/components/PlayHistoryDialog';
import { expect, fn, within } from 'storybook/test';

import { djLibrary } from './_fixtures/dj-library';

const meta: Meta<typeof PlayHistoryDialog> = {
  title: 'Tahti/Desktop/PlayHistoryDialog',
  component: PlayHistoryDialog,
  args: {
    isOpen: true,
    onClose: fn(),
    onChanged: fn(),
    library: djLibrary(),
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const LastSession: Story = {
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await expect(
      await body.findByRole('button', { name: /Copy last session/ }),
    ).toBeVisible();
    await expect(body.getByText(/Your last session is 4 tracks/)).toBeVisible();
  },
};

export const Empty: Story = {
  args: { library: djLibrary({ history: [] }) },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await expect(await body.findByText(/Nothing yet/)).toBeVisible();
    await expect(
      body.queryByRole('button', { name: /Copy last session/ }),
    ).toBeNull();
  },
};
