import type { Meta, StoryObj } from '@storybook/react-vite';
import { VideoOrImageField } from '@tahti-web/components/channel-designer/VideoOrImageField';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';

/**
 * Shared MP4/WebM/image picker + optional URL field, used both in the
 * Player → Video/image tab (`compact`) and the Header video/backdrop style
 * (`backdrop`, with preview + remove). Same component, same state shape —
 * ChannelDesigner shares one upload between both surfaces, and passes
 * `disabled` while a save is in flight.
 *
 * Missing states: an actual video preview (needs a real object URL, not
 * mockable in Storybook), YouTube-URL preview.
 */
const meta: Meta<typeof VideoOrImageField> = {
  title: 'Tahti/Channel/Designer/VideoOrImageField',
  component: VideoOrImageField,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    variant: 'compact',
    disabled: false,
    pendingFile: null,
    url: '',
    urlOpen: false,
    previewUrl: null,
    isImage: false,
    onUrlOpenChange: fn(),
    onUrlChange: fn(),
    onFiles: fn(),
  },
  render: function Render(args) {
    const [urlOpen, setUrlOpen] = useState(args.urlOpen);
    const [url, setUrl] = useState(args.url);
    return (
      <div className="max-w-lg">
        <VideoOrImageField
          {...args}
          url={url}
          urlOpen={urlOpen}
          onUrlOpenChange={(open) => {
            setUrlOpen(open);
            args.onUrlOpenChange(open);
          }}
          onUrlChange={(next) => {
            setUrl(next);
            args.onUrlChange(next);
          }}
          onRemove={
            args.onRemove
              ? () => {
                  setUrl('');
                  args.onRemove?.();
                }
              : undefined
          }
        />
      </div>
    );
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Compact: Story = {
  name: 'Player → Video/image tab',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: 'Show URL field' }),
    );
    await expect(args.onUrlOpenChange).toHaveBeenCalledWith(true);
    const input = canvas.getByLabelText('YouTube, video, or image URL');
    await userEvent.type(input, 'https://example.com/loop.mp4');
    await expect(args.onUrlChange).toHaveBeenLastCalledWith(
      'https://example.com/loop.mp4',
    );
  },
};

export const Backdrop: Story = {
  name: 'Header video/image backdrop',
  args: { variant: 'backdrop' },
};

export const BackdropWithPreview: Story = {
  name: 'Backdrop — image preview + remove',
  args: {
    variant: 'backdrop',
    url: 'https://picsum.photos/seed/tahti-backdrop/1200/600',
    isImage: true,
    onRemove: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: 'Remove backdrop' }),
    );
    await expect(args.onRemove).toHaveBeenCalledOnce();
    await expect(
      canvas.queryByRole('button', { name: 'Remove backdrop' }),
    ).toBeNull();
  },
};

export const DisabledWhileSaving: Story = {
  name: 'Disabled (save in flight)',
  args: { variant: 'backdrop', disabled: true },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByLabelText('Choose a video or image'),
    ).toBeDisabled();
  },
};
