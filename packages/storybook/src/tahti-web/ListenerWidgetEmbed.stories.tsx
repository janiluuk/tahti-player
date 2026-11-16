import type { Meta, StoryObj } from '@storybook/react-vite';
import { ListenerWidgetEmbed } from '@tahti-web/components/ListenerWidgetEmbed';
import { expect, within } from 'storybook/test';

const meta: Meta<typeof ListenerWidgetEmbed> = {
  title: 'Tahti/Widgets/ListenerWidgetEmbed',
  component: ListenerWidgetEmbed,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SoundCloud: Story = {
  args: {
    instance: {
      id: 'widget-1',
      typeId: 'soundcloud',
      input: 'https://soundcloud.com/artist/track',
      label: 'Northern Lights — Aurora Drift',
      addedAt: new Date().toISOString(),
    },
    onRemove: () => {},
  },
};

export const SoundCloudProfile: Story = {
  args: {
    instance: {
      id: 'widget-1b',
      typeId: 'soundcloud',
      input: 'https://soundcloud.com/northern-lights',
      label: 'Northern Lights — public tracks',
      addedAt: new Date().toISOString(),
    },
    onRemove: () => {},
  },
};

export const YouTube: Story = {
  args: {
    instance: {
      id: 'widget-2',
      typeId: 'youtube',
      input: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      label: 'Tundra Static — Live session',
      addedAt: new Date().toISOString(),
    },
    onRemove: () => {},
  },
};

export const YouTubePlaylist: Story = {
  args: {
    instance: {
      id: 'widget-2b',
      typeId: 'youtube',
      input: 'https://www.youtube.com/playlist?list=PLexampleplaylist',
      label: 'Tundra Static — session recordings',
      addedAt: new Date().toISOString(),
    },
    onRemove: () => {},
  },
};

export const Bandcamp: Story = {
  args: {
    instance: {
      id: 'widget-4',
      typeId: 'bandcamp',
      input:
        'https://bandcamp.com/EmbeddedPlayer/album=1234567890/size=large/bgcol=333333/linkcol=ffffff/',
      label: 'Kasari — Downtempo EP',
      addedAt: new Date().toISOString(),
    },
    onRemove: () => {},
  },
};

export const SpotifyPlaylist: Story = {
  args: {
    instance: {
      id: 'widget-5',
      typeId: 'spotify',
      input: 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M',
      label: 'Late night picks',
      addedAt: new Date().toISOString(),
    },
    onRemove: () => {},
  },
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByText('Night Drive'),
    ).toBeInTheDocument();
  },
};

export const SpotifyArtist: Story = {
  args: {
    instance: {
      id: 'widget-6',
      typeId: 'spotify',
      input: 'https://open.spotify.com/artist/0OdUWJ0sBjDrqHygGUXeCF',
      label: 'Mock Artist on Spotify',
      addedAt: new Date().toISOString(),
    },
    onRemove: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('Night Drive')).toBeInTheDocument();
    await expect(canvas.getByTestId('listener-widget-embed')).toHaveAttribute(
      'data-widget-type',
      'spotify',
    );
  },
};

export const UnrecognizedUrl: Story = {
  args: {
    instance: {
      id: 'widget-3',
      typeId: 'soundcloud',
      input: 'not-a-real-url',
      label: 'Bad paste',
      addedAt: new Date().toISOString(),
    },
    onRemove: () => {},
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('alert')).toHaveTextContent(
      "Couldn't recognize this URL. Remove it and try pasting the SoundCloud link again.",
    );
  },
};
