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

import { ActionSheet, Badge, Button } from '@tahti-player/ui';

const meta: Meta<typeof ActionSheet> = {
  title: 'Components/ActionSheet',
  component: ActionSheet,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof ActionSheet>;

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
          <ActionSheet.Action
            icon={<Share2Icon size={22} />}
            onClick={() => {}}
          >
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
};

export const Mobile: Story = {
  ...TrackOptions,
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'mobile1' },
  },
};
