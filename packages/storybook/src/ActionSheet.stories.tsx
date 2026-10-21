import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  HeartIcon,
  ListMusicIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Share2Icon,
  UserIcon,
} from 'lucide-react';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { ActionSheet, Badge, Button } from '@tahti-player/ui';

import { withinBody } from './tahti-web/_lib/play';

const meta: Meta<typeof ActionSheet> = {
  title: 'Components/ActionSheet',
  component: ActionSheet,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof ActionSheet>;

const onShare = fn();

export const TrackOptions: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);
    return (
      <>
        <Button
          size="icon"
          aria-label="More options"
          onClick={() => setIsOpen(true)}
        >
          <MoreHorizontalIcon size={20} aria-hidden />
        </Button>
        <ActionSheet
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          label="Track options"
        >
          <ActionSheet.Header
            title="Moody Electronica vol. 9 @ Hearthis.at Live"
            subtitle="Yaniho"
            coverUrl="https://picsum.photos/seed/tahti-sheet/256"
            meta={
              <Badge variant="pill" color="secondary">
                House
              </Badge>
            }
          />
          <ActionSheet.Action icon={<UserIcon size={22} />} onClick={() => {}}>
            Go to channel
          </ActionSheet.Action>
          <ActionSheet.Action icon={<Share2Icon size={22} />} onClick={onShare}>
            Share
          </ActionSheet.Action>
          <ActionSheet.Action icon={<HeartIcon size={22} />} onClick={() => {}}>
            Add to favorites
          </ActionSheet.Action>
          <ActionSheet.Action
            icon={<ListMusicIcon size={22} />}
            onClick={() => {}}
          >
            Add to playlist
          </ActionSheet.Action>
          <ActionSheet.Action
            icon={<PencilIcon size={22} />}
            onClick={() => {}}
            disabled
          >
            Edit
          </ActionSheet.Action>
        </ActionSheet>
      </>
    );
  },
  play: async ({ canvasElement }) => {
    onShare.mockClear();
    const body = withinBody(canvasElement);
    const sheet = within(
      await body.findByRole('dialog', { name: 'Track options' }),
    );
    await expect(sheet.getByRole('button', { name: 'Edit' })).toBeDisabled();

    await userEvent.click(sheet.getByRole('button', { name: 'Share' }));
    await expect(onShare).toHaveBeenCalledOnce();
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull());

    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'More options' }),
    );
    await expect(
      await body.findByRole('dialog', { name: 'Track options' }),
    ).toBeVisible();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull());
  },
};

export const Mobile: Story = {
  ...TrackOptions,
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'mobile1' },
  },
};
