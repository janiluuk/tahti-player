import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChannelPagePreview } from '@tahti-web/components/channel-designer/ChannelPagePreview';
import { expect, fn, userEvent, within } from 'storybook/test';

import {
  DESIGN_SCHEME,
  DESIGN_VISUAL,
  designLayout,
} from './_fixtures/channel-design';
import { withTahtiRouter } from './_lib/decorators';

/** The designer's "Live page preview" column: backdrop card, player stage,
 * navigation strip and placeholder tracks. Clicking the header or the
 * player jumps to its controls in the real designer. */
const meta: Meta<typeof ChannelPagePreview> = {
  title: 'Tahti/Channel/Designer/PagePreview',
  component: ChannelPagePreview,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/settings/artist?tab=channel-designer')],
  args: {
    displayName: 'Northern Lights',
    username: 'northern-lights',
    channelSlug: 'northern-lights',
    avatarUrl: 'https://picsum.photos/seed/tahti-northern-lights/256',
    bio: 'Ambient / downtempo, streaming most weeknights.',
    layout: designLayout(),
    visual: DESIGN_VISUAL,
    previewStyle: {
      accent: DESIGN_SCHEME.accent,
      highlight: DESIGN_SCHEME.highlight,
      bg: DESIGN_SCHEME.bg,
      fg: DESIGN_SCHEME.text,
      gradient: 'linear-gradient(135deg,#A78BFA,#22D3EE,#0B1220)',
    },
    previewVideoUrl: '',
    showHeaderVideo: false,
    headerBackdropIsImage: false,
    previewPreset: 'AURORA',
    scheme: DESIGN_SCHEME,
    galleryMode: 'NONE',
    galleryImageList: [],
    slideshowPreset: 'FADE',
    slideshowInterval: 8,
    slideshowTransition: 600,
    slideshowAutoplay: true,
    mountVisualizer: false,
    highlightSection: null,
    onEditBackdrop: fn(),
    onEditPlayer: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Gradient: Story = {
  name: 'Gradient header + top bar',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const preview = canvas.getByRole('main', { name: 'Channel page preview' });
    await expect(
      within(preview).getByTestId('channel-backdrop-top-bar'),
    ).toHaveTextContent('New album "Polar Drift" out Friday');
    await expect(
      within(preview).getByText('About Northern Lights'),
    ).toBeVisible();

    await userEvent.click(canvas.getByTestId('channel-designer-stage-player'));
    await expect(args.onEditPlayer).toHaveBeenCalledOnce();
    await userEvent.click(
      canvas.getByRole('button', { name: 'Edit backdrop design' }),
    );
    await expect(args.onEditBackdrop).toHaveBeenCalledOnce();
  },
};

export const PlayerHighlighted: Story = {
  name: 'Player highlighted (jumped from controls)',
  args: { highlightSection: 'visualizer' },
};

export const SolidSubscribe: Story = {
  name: 'Solid header, Subscribe shown, bio hidden',
  args: {
    visual: { ...DESIGN_VISUAL, headerStyle: 'SOLID', topBarText: null },
    layout: designLayout().map((item) =>
      item.type === 'subscribe'
        ? { ...item, visible: true }
        : item.type === 'about'
          ? { ...item, visible: false }
          : item,
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByTestId('channel-backdrop-subscribe-cta'),
    ).toBeVisible();
    await expect(canvas.queryByTestId('channel-backdrop-top-bar')).toBeNull();
  },
};

export const Slideshow: Story = {
  name: 'Slideshow header',
  args: {
    galleryMode: 'STATIC_SLIDESHOW',
    galleryImageList: [
      'https://picsum.photos/seed/tahti-slide-1/1200/600',
      'https://picsum.photos/seed/tahti-slide-2/1200/600',
      'https://picsum.photos/seed/tahti-slide-3/1200/600',
    ],
  },
};

export const LiveVisualizer: Story = {
  name: 'Visualization header (live WebGL)',
  args: {
    visual: { ...DESIGN_VISUAL, headerStyle: 'VISUALIZATION' },
    mountVisualizer: true,
  },
};
