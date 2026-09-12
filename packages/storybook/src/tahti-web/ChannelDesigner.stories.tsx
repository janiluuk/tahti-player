import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChannelDesigner } from '@tahti-web/components/ChannelDesigner';
import { CHANNEL_LOOK_ELEMENTS } from '@tahti-web/lib/channelLookElements';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';

/**
 * Channel Designer broken out by look element so each panel can be corrected
 * in isolation. Prefer `livePreview: false` here to avoid dual WebGL with
 * other stories. Full interactive preview: use the **Full** story.
 *
 * Correction tracker: `docs/todo/channel-designer-storybook-elements.md`.
 *
 * Missing states: empty/error visual load, slideshow with many frames,
 * video-loop upload progress, player tab with every visualizer preset.
 */
const meta: Meta<typeof ChannelDesigner> = {
  title: 'Tahti/Channel/Designer',
  component: ChannelDesigner,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [
    withTahtiRouter('/settings/artist?tab=channel-designer'),
    withMockAuth(MOCK_USERS.artist),
  ],
  args: {
    displayName: 'Northern Lights',
    username: 'northern-lights',
    channelSlug: 'northern-lights',
    bio: 'Ambient / downtempo, streaming most weeknights.',
    livePreview: false,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const designerArgs = {
  displayName: 'Northern Lights',
  username: 'northern-lights',
  channelSlug: 'northern-lights',
  bio: 'Ambient / downtempo, streaming most weeknights.',
  livePreview: false as const,
};

export const Full: Story = {
  name: 'Full (preview + controls)',
  args: {
    ...designerArgs,
    livePreview: true,
  },
};

export const Compact: Story = {
  name: 'Compact (profile tab)',
  args: {
    ...designerArgs,
    compact: true,
  },
};

export const LookOnlyShell: Story = {
  name: 'Look-only shell (layers dock)',
  args: {
    ...designerArgs,
    lookOnly: true,
  },
};

/** One story per CHANNEL_LOOK_ELEMENTS id — select that panel in look-only mode. */
function lookElementStory(
  id: (typeof CHANNEL_LOOK_ELEMENTS)[number]['id'],
): Story {
  const metaRow = CHANNEL_LOOK_ELEMENTS.find((element) => element.id === id);
  return {
    name: metaRow ? `${metaRow.label} (${id})` : id,
    args: {
      ...designerArgs,
      lookOnly: true,
      lookOpenSection: id,
    },
  };
}

export const Backdrop = lookElementStory('backdrop');
export const Player = lookElementStory('player');
export const Releases = lookElementStory('releases');
export const Tracks = lookElementStory('tracks');
export const Latest = lookElementStory('latest');
export const Feed = lookElementStory('feed');
export const News = lookElementStory('news');
export const Bio = lookElementStory('bio');
export const Shows = lookElementStory('shows');
export const Gallery = lookElementStory('gallery');

export const PlayerDesignAlias: Story = {
  name: 'Player (legacy player-design section id)',
  args: {
    ...designerArgs,
    lookOnly: true,
    lookOpenSection: 'player-design',
  },
};

export const TextOverlayAlias: Story = {
  name: 'Player (legacy text-overlay section id)',
  args: {
    ...designerArgs,
    lookOnly: true,
    lookOpenSection: 'text-overlay',
  },
};
