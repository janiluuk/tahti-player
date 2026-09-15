import { Meta, StoryObj } from '@storybook/react-vite';
import { BarcodeIcon, Disc3Icon, Music2Icon } from 'lucide-react';
import { useState } from 'react';

import { SelectableTile, SelectableTiles } from '@tahti-player/ui';

const meta = {
  title: 'Components/SelectableTiles',
  component: SelectableTiles,
  tags: ['autodocs'],
} satisfies Meta<typeof SelectableTiles>;

export default meta;

type Story = StoryObj<typeof SelectableTiles>;

const catalogMethods: SelectableTile[] = [
  {
    id: 'upc',
    label: 'UPC / EAN',
    description: 'Identify the release with its barcode.',
    icon: <BarcodeIcon size={18} aria-hidden />,
  },
  {
    id: 'musicbrainz',
    label: 'MusicBrainz',
    description: 'Link the open catalog release and artist records.',
    icon: <Music2Icon size={18} aria-hidden />,
  },
  {
    id: 'discogs',
    label: 'Discogs',
    description: 'Link the community catalog release entry.',
    icon: <Disc3Icon size={18} aria-hidden />,
  },
];

const guides: SelectableTile[] = [
  {
    id: 'musicbrainz',
    label: 'MusicBrainz',
    icon: <Music2Icon size={28} aria-hidden />,
  },
  {
    id: 'discogs',
    label: 'Discogs',
    icon: <Disc3Icon size={28} aria-hidden />,
  },
  {
    id: 'upc',
    label: 'UPC / EAN',
    icon: <BarcodeIcon size={28} aria-hidden />,
  },
];

export const Interactive: Story = {
  render: () => {
    const [single, setSingle] = useState('musicbrainz');
    const [multi, setMulti] = useState(['upc']);

    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h3 className="text-foreground text-sm font-semibold">
            Row layout — multi select with descriptions
          </h3>
          <SelectableTiles
            multiple
            items={catalogMethods}
            selected={multi}
            onChange={setMulti}
            className="sm:grid-cols-3"
          />
          <p className="text-foreground/60 text-xs">
            Selected: {multi.length > 0 ? multi.join(', ') : 'none'}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-foreground text-sm font-semibold">
            Centered layout — single select, icon only
          </h3>
          <SelectableTiles
            items={guides}
            selected={single}
            onChange={setSingle}
            layout="centered"
            className="sm:grid-cols-3"
          />
          <p className="text-foreground/60 text-xs">Selected: {single}</p>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-foreground text-sm font-semibold">Disabled</h3>
          <SelectableTiles
            items={catalogMethods}
            selected={single}
            onChange={setSingle}
            disabled
            className="sm:grid-cols-3"
          />
        </div>
      </div>
    );
  },
};
