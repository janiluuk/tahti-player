import type { Meta, StoryObj } from '@storybook/react-vite';
import { ClearQueueConfirmDialog } from '@tahti-web/components/ClearQueueConfirmDialog';
import { QueueConfirmDialog } from '@tahti-web/components/QueueConfirmDialog';
import { RemoveWidgetDialog } from '@tahti-web/components/RemoveWidgetDialog';
import { expect, fn, screen, userEvent } from 'storybook/test';

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

const onQueueConfirm = fn();

export const ReplaceQueue: Story = {
  render: () => (
    <QueueConfirmDialog
      isOpen
      count={8}
      sourceLabel="Midnight Archive"
      onCancel={fn()}
      onConfirm={onQueueConfirm}
    />
  ),
  play: async () => {
    await expect(await screen.findByText('Queue 8 tracks?')).toBeVisible();
    await userEvent.click(
      await screen.findByRole('button', { name: 'Queue 8 tracks' }),
    );
    await expect(onQueueConfirm).toHaveBeenCalledTimes(1);
  },
};

const onRemoveCancel = fn();

export const RemoveWidget: Story = {
  render: () => (
    <RemoveWidgetDialog
      isOpen
      label="YleX"
      onCancel={onRemoveCancel}
      onConfirm={fn()}
    />
  ),
  play: async () => {
    await expect(await screen.findByText('Remove YleX?')).toBeVisible();
    await userEvent.click(
      await screen.findByRole('button', { name: 'Cancel' }),
    );
    await expect(onRemoveCancel).toHaveBeenCalled();
  },
};
