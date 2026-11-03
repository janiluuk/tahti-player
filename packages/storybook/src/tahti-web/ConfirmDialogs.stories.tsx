import type { Meta, StoryObj } from '@storybook/react-vite';
import { ClearQueueConfirmDialog } from '@tahti-web/components/ClearQueueConfirmDialog';
import { QueueConfirmDialog } from '@tahti-web/components/QueueConfirmDialog';
import { RemoveWidgetDialog } from '@tahti-web/components/RemoveWidgetDialog';
import { expect, fn, screen } from 'storybook/test';

const meta: Meta = {
  title: 'Tahti/Components/Confirm dialogs',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Confirmations before clearing the queue, replacing it with a collection, or removing a Listen widget.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const ClearQueue: Story = {
  render: () => (
    <ClearQueueConfirmDialog
      isOpen
      count={12}
      onCancel={fn()}
      onConfirm={fn()}
    />
  ),
  play: async () => {
    await expect(await screen.findByText('Clear queue?')).toBeVisible();
  },
};

export const ReplaceQueue: Story = {
  render: () => (
    <QueueConfirmDialog
      isOpen
      count={8}
      sourceLabel="Midnight Archive"
      onCancel={fn()}
      onConfirm={fn()}
    />
  ),
};

export const RemoveWidget: Story = {
  render: () => (
    <RemoveWidgetDialog isOpen label="YleX" onCancel={fn()} onConfirm={fn()} />
  ),
};
