import type { Meta, StoryObj } from '@storybook/react-vite';
import { StemMixer } from '@tahti-web/components/StemMixer';
import { expect, userEvent, within } from 'storybook/test';

/**
 * Each stem is a plain `<audio src>` and Storybook has no real stem files,
 * so these point at one public-domain clip so the transport plays rather
 * than silently failing on a 404.
 */
const meta: Meta<typeof StemMixer> = {
  title: 'Tahti/Player/StemMixer',
  component: StemMixer,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const SAMPLE_URL =
  'https://upload.wikimedia.org/wikipedia/commons/transcoded/6/6c/Grieg_Piano_Concerto_-_1._Allegro_molto_moderato.ogg/Grieg_Piano_Concerto_-_1._Allegro_molto_moderato.ogg.mp3';

const FOUR_STEMS = [
  { label: 'Vocals', url: SAMPLE_URL },
  { label: 'Drums', url: SAMPLE_URL },
  { label: 'Bass', url: SAMPLE_URL },
  { label: 'Other', url: SAMPLE_URL },
];

export const FourStems: Story = {
  args: { files: FOUR_STEMS },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const solo = canvas.getByRole('button', { name: 'Solo Vocals' });
    await userEvent.click(solo);
    await expect(solo).toHaveAttribute('aria-pressed', 'true');
    await expect(
      canvas.getByRole('button', { name: 'Reset stem mix' }),
    ).toBeInTheDocument();
    await userEvent.click(
      canvas.getByRole('button', { name: 'Reset stem mix' }),
    );
    await expect(solo).toHaveAttribute('aria-pressed', 'false');
  },
};

export const TwoStems: Story = {
  args: {
    files: [
      { label: 'Vocals', url: SAMPLE_URL },
      { label: 'Instrumental', url: SAMPLE_URL },
    ],
  },
};

export const MixedDown: Story = {
  name: 'Drums soloed, bass muted, vocals at 40%',
  args: {
    files: FOUR_STEMS,
    defaultMix: {
      Drums: { muted: false, solo: true, level: 1 },
      Bass: { muted: true, solo: false, level: 0.8 },
      Vocals: { muted: false, solo: false, level: 0.4 },
    },
  },
};

export const Empty: Story = {
  name: 'Empty (renders nothing)',
  args: { files: [] },
};
