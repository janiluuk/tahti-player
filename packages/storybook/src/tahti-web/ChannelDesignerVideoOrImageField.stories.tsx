import type { Meta, StoryObj } from '@storybook/react-vite';
import { VideoOrImageField } from '@tahti-web/components/channel-designer/VideoOrImageField';
import { useState } from 'react';

/**
 * Shared MP4/WebM/image picker + optional URL field, used both in the
 * Player → Video/image tab (`compact`) and the Header video/backdrop style
 * (`backdrop`, with preview + remove). Same component, same state shape —
 * ChannelDesigner shares one upload between both surfaces.
 *
 * Missing states: an actual video preview (needs a real object URL, not
 * mockable in Storybook), YouTube-URL preview.
 */
const meta: Meta<typeof VideoOrImageField> = {
  title: 'Tahti/Channel/Designer/VideoOrImageField',
  component: VideoOrImageField,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

function Demo({
  variant,
  withPreview = false,
}: {
  variant: 'compact' | 'backdrop';
  withPreview?: boolean;
}) {
  const [urlOpen, setUrlOpen] = useState(false);
  const [url, setUrl] = useState(
    withPreview ? 'https://example.com/backdrop.jpg' : '',
  );

  return (
    <div className="max-w-lg">
      <VideoOrImageField
        variant={variant}
        pendingFile={null}
        url={url}
        urlOpen={urlOpen}
        onUrlOpenChange={setUrlOpen}
        onUrlChange={setUrl}
        onFiles={() => undefined}
        previewUrl={null}
        isImage={withPreview}
        onRemove={withPreview ? () => setUrl('') : undefined}
      />
    </div>
  );
}

export const Compact: Story = {
  name: 'Player → Video/image tab',
  render: () => <Demo variant="compact" />,
};

export const Backdrop: Story = {
  name: 'Header video/image backdrop',
  render: () => <Demo variant="backdrop" />,
};

export const BackdropWithPreview: Story = {
  name: 'Backdrop — image preview + remove',
  render: () => <Demo variant="backdrop" withPreview />,
};

export const CompactPendingGenerated: Story = {
  name: 'Player → pending generated viz clip',
  render: () => {
    const [urlOpen, setUrlOpen] = useState(false);
    const pending = new File(
      [new Uint8Array(512_000)],
      'tahti-visualizer.webm',
      { type: 'video/webm' },
    );
    return (
      <div className="max-w-lg">
        <VideoOrImageField
          variant="compact"
          pendingFile={pending}
          url=""
          urlOpen={urlOpen}
          onUrlOpenChange={setUrlOpen}
          onUrlChange={() => undefined}
          onFiles={() => undefined}
        />
      </div>
    );
  },
};
