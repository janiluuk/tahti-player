import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ChannelGalleryMode } from '@tahti-web/api/channel-gallery';
import { SlideshowControls } from '@tahti-web/components/channel-designer/SlideshowControls';
import { useState } from 'react';

/**
 * Slideshow backdrop editor: thumbnails (drag to reorder, hover to remove),
 * gallery style, and transition timing (timing only shows for 2+ images).
 */
const meta: Meta<typeof SlideshowControls> = {
  title: 'Tahti/Channel/Designer/SlideshowControls',
  component: SlideshowControls,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const swatch = (hue: number) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="90"><rect width="160" height="90" fill="hsl(${hue} 60% 45%)"/></svg>`,
  )}`;

function Demo({ initial }: { initial: string[] }) {
  const [images, setImages] = useState(initial);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [mode, setMode] = useState<ChannelGalleryMode>('STATIC_SLIDESHOW');
  const [preset, setPreset] = useState('FADE');
  const [interval, setInterval] = useState(8);
  const [transition, setTransition] = useState(600);
  const [autoplay, setAutoplay] = useState(true);
  return (
    <div className="max-w-sm">
      <SlideshowControls
        images={images}
        previewIndex={previewIndex}
        onPreviewIndexChange={setPreviewIndex}
        busy={false}
        onReorder={(from, to) =>
          setImages((current) => {
            const next = [...current];
            const [moved] = next.splice(from, 1);
            if (moved) {
              next.splice(to, 0, moved);
            }
            return next;
          })
        }
        onRemove={(index) =>
          setImages((current) => current.filter((_, i) => i !== index))
        }
        pickerOpen={pickerOpen}
        onPickerOpenChange={setPickerOpen}
        pickedFiles={[]}
        onFilesPicked={() => Promise.resolve()}
        galleryMode={mode}
        onGalleryModeChange={setMode}
        preset={preset}
        onPresetChange={setPreset}
        interval={interval}
        onIntervalChange={setInterval}
        transition={transition}
        onTransitionChange={setTransition}
        autoplay={autoplay}
        onAutoplayChange={setAutoplay}
      />
    </div>
  );
}

export const Empty: Story = { render: () => <Demo initial={[]} /> };
export const SingleImage: Story = {
  render: () => <Demo initial={[swatch(200)]} />,
};
export const Slideshow: Story = {
  render: () => (
    <Demo initial={[swatch(10), swatch(90), swatch(200), swatch(290)]} />
  ),
};
