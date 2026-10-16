import type { Meta, StoryObj } from '@storybook/react-vite';

import { AmbientCard, CardGrid } from '@tahti-player/ui';

const meta = {
  title: 'Components/AmbientCard',
  component: AmbientCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Same shape as `Card`, but the chrome is a glass wash sampled from the cover: blurred artwork + dominant-color tint behind, frosted label so title/subtitle stay readable. Prefer this when a per-card ambient bleed matters; plain `Card` stays the opaque primary chrome.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AmbientCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Deterministic covers (picsum ids) plus forced RGB so Storybook does not
 * depend on canvas CORS for the tint. */
const EXAMPLES: Array<{
  src: string;
  title: string;
  subtitle: string;
  ambientRgb: [number, number, number];
}> = [
  {
    src: 'https://picsum.photos/id/1015/400',
    title: 'Fjords at Dusk',
    subtitle: 'Cool blue wash',
    ambientRgb: [36, 78, 128],
  },
  {
    src: 'https://picsum.photos/id/292/400',
    title: 'Amber Terminal',
    subtitle: 'Warm gold wash',
    ambientRgb: [180, 110, 42],
  },
  {
    src: 'https://picsum.photos/id/1040/400',
    title: 'Paper Lantern',
    subtitle: 'Bright cover → light glass',
    ambientRgb: [232, 220, 198],
  },
  {
    src: 'https://picsum.photos/id/1039/400',
    title: 'Night Bus',
    subtitle: 'Dark cover → dark glass',
    ambientRgb: [18, 22, 36],
  },
  {
    src: 'https://picsum.photos/id/1062/400',
    title: 'Magenta Loop',
    subtitle: 'Saturated violet',
    ambientRgb: [120, 48, 140],
  },
  {
    src: 'https://picsum.photos/id/1080/400',
    title: 'Verdant Field',
    subtitle: 'Forest green',
    ambientRgb: [48, 110, 72],
  },
];

export const Examples: Story = {
  render: () => (
    <div className="bg-background flex flex-col gap-6 p-4">
      <p className="text-foreground-secondary max-w-xl text-sm">
        Glass AmbientCard — cover blur + dominant tint. Labels use light or dark
        frost from cover luminance so text stays readable.
      </p>
      <CardGrid>
        {EXAMPLES.map((example) => (
          <AmbientCard
            key={example.title}
            src={example.src}
            title={example.title}
            subtitle={example.subtitle}
            ambientRgb={example.ambientRgb}
          />
        ))}
      </CardGrid>
    </div>
  ),
};

export const WithPlayOverlay: Story = {
  args: {
    src: EXAMPLES[0].src,
    title: EXAMPLES[0].title,
    subtitle: EXAMPLES[0].subtitle,
    ambientRgb: EXAMPLES[0].ambientRgb,
    onPlay: () => undefined,
    playLabel: 'Play',
    pauseLabel: 'Pause',
  },
};

export const LongLabels: Story = {
  args: {
    src: EXAMPLES[1].src,
    title:
      'An Incredibly, Ridiculously Long Album Title That Should Truncate On Glass',
    subtitle:
      'A Very Long Artist Name Featuring Another Artist With Even More Characters',
    ambientRgb: EXAMPLES[1].ambientRgb,
  },
};

export const WithoutCover: Story = {
  args: {
    title: 'No artwork yet',
    subtitle: 'Falls back to dark glass',
    ambientRgb: null,
  },
};
