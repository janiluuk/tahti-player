import type { Meta, StoryObj } from '@storybook/react-vite';
import type { IntegrationId } from '@tahti-web/api/sources';
import {
  SourceServiceIcon,
  sourceTileSubtitle,
} from '@tahti-web/components/SourceServiceIcon';

const ALL_IDS: IntegrationId[] = [
  'upload',
  'stash',
  'bandcamp',
  'soundcloud',
  'google-drive',
  'mixcloud',
  'mixcloud-embed',
  'url',
  'spotify',
  'hearthis',
  'mikseri',
  'broadcast',
  'radio',
  'musicbrainz',
];

const meta: Meta<typeof SourceServiceIcon> = {
  title: 'Tahti/Misc/SourceServiceIcon',
  component: SourceServiceIcon,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Tile: Story = {
  args: { id: 'bandcamp', size: 'tile' },
  render: (args) => (
    <div className="h-16 w-16 overflow-hidden rounded-lg">
      <SourceServiceIcon {...args} />
    </div>
  ),
};

export const Detail: Story = {
  args: { id: 'spotify', size: 'detail' },
};

/** Every supported source/integration id, tile-size, with its subtitle. */
export const AllServices: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {ALL_IDS.map((id) => (
        <div
          key={id}
          className="border-border flex flex-col items-center gap-2 rounded-lg border p-3 text-center"
        >
          <div className="h-16 w-16 overflow-hidden rounded-lg">
            <SourceServiceIcon id={id} size="tile" />
          </div>
          <span className="text-xs font-semibold">{id}</span>
          <span className="text-foreground-secondary text-[11px]">
            {sourceTileSubtitle(id)}
          </span>
        </div>
      ))}
    </div>
  ),
};
