import type { Meta, StoryObj } from '@storybook/react-vite';
import { PlusIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import { expect, userEvent, waitFor } from 'storybook/test';

import { Button, Dialog, Input } from '@tahti-player/ui';

import { expectNoDialog, openDialog } from './tahti-web/_lib/play';

const meta: Meta<typeof Dialog> = {
  title: 'Components/Dialog',
  component: Dialog,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Dialog>;

export const Confirmation: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>
          <Trash2Icon size={16} className="mr-1.5" aria-hidden />
          Delete Playlist
        </Button>
        <Dialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Delete Playlist"
          description="Are you sure you want to delete this playlist? This action cannot be undone."
          actions={
            <>
              <Dialog.Close>Cancel</Dialog.Close>
              <Button intent="danger" onClick={() => setIsOpen(false)}>
                <Trash2Icon size={16} className="mr-1.5" aria-hidden />
                Delete
              </Button>
            </>
          }
        />
      </>
    );
  },
  play: async ({ canvasElement }) => {
    const dialog = await openDialog(
      canvasElement,
      'Delete Playlist',
      'Delete Playlist',
    );
    await expect(
      dialog.getByText(/This action cannot be undone/),
    ).toBeVisible();
    await userEvent.click(dialog.getByRole('button', { name: 'Cancel' }));
    await expectNoDialog(canvasElement);

    await openDialog(canvasElement, 'Delete Playlist', 'Delete Playlist');
    await userEvent.keyboard('{Escape}');
    await expectNoDialog(canvasElement);
  },
};

export const WithInput: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState('');
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>
          <PlusIcon size={16} className="mr-1.5" aria-hidden />
          Create Playlist
        </Button>
        <Dialog.Root isOpen={isOpen} onClose={() => setIsOpen(false)}>
          <Dialog.Title>Create new playlist</Dialog.Title>
          <Dialog.Description>
            Give your playlist a name to get started.
          </Dialog.Description>
          <div className="mt-4">
            <Input
              label="Name"
              placeholder="My playlist"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <Dialog.Actions>
            <Dialog.Close>Cancel</Dialog.Close>
            <Button onClick={() => setIsOpen(false)}>
              <PlusIcon size={16} className="mr-1.5" aria-hidden />
              Create
            </Button>
          </Dialog.Actions>
        </Dialog.Root>
      </>
    );
  },
  play: async ({ canvasElement }) => {
    const dialog = await openDialog(
      canvasElement,
      'Create Playlist',
      'Create new playlist',
    );
    const name = dialog.getByLabelText('Name');
    await waitFor(() => expect(name).toBeVisible());
    await userEvent.type(name, 'Night bus');
    await expect(name).toHaveValue('Night bus');
    await userEvent.click(dialog.getByRole('button', { name: 'Create' }));
    await expectNoDialog(canvasElement);
  },
};
