import { SelectableTiles, type SelectableTile } from '@tahti-player/ui';
import { VISUALIZER_MODE_LABELS } from '@tahti-player/visualizer';

import { CHANNEL_VIZ_PACKS, channelVizPack } from '../../lib/channelVizPacks';
import { Eyebrow } from '../tahti/Eyebrow';

const NO_PACK = 'none';

const PACK_TILES: SelectableTile[] = [
  {
    id: NO_PACK,
    label: 'No pack',
    description: 'Use the visualizer preset above.',
  },
  ...CHANNEL_VIZ_PACKS.map((pack) => ({
    id: pack.id,
    label: pack.label,
    description: `${pack.description} ${pack.modes
      .map((mode) => VISUALIZER_MODE_LABELS[mode])
      .join(' · ')}`,
  })),
];

type Props = {
  value: string | null;
  onChange: (packId: string | null) => void;
  disabled?: boolean;
};

/** Channel-night viz pack: replaces the preset with a rotating set of
 * Advanced/Cymatics scenes, and listeners see its name on the channel. */
export function ChannelVizPackPicker({ value, onChange, disabled }: Props) {
  const selected = channelVizPack(value)?.id ?? NO_PACK;

  return (
    <section
      className="flex flex-col gap-2"
      data-testid="channel-viz-pack-picker"
    >
      <Eyebrow>Show pack</Eyebrow>
      <p className="text-foreground-secondary text-xs">
        Listeners see the pack name on your channel while the header shows the
        visualizer.
      </p>
      <SelectableTiles
        aria-label="Visualizer pack"
        className="sm:grid-cols-2"
        items={PACK_TILES}
        selected={selected}
        disabled={disabled}
        onChange={(id) => onChange(id === NO_PACK ? null : id)}
      />
    </section>
  );
}
