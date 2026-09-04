import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  LAYOUT_ONLY_LOOK_IDS,
  LayoutOnlyLookHint,
} from '@tahti-web/components/channel-designer/LayoutOnlyLookHint';
import { CHANNEL_LOOK_ELEMENTS } from '@tahti-web/lib/channelLookElements';

/**
 * Look rows that only explain visibility (eye toggle). Correct copy here
 * so Releases…Gallery stay consistent with CHANNEL_LOOK_ELEMENTS.hint.
 */
const meta: Meta<typeof LayoutOnlyLookHint> = {
  title: 'Tahti/Channel/Designer/LayoutOnlyLookHint',
  component: LayoutOnlyLookHint,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const AllRows: Story = {
  name: 'All layout-only rows',
  render: () => (
    <div className="flex max-w-md flex-col gap-4">
      {LAYOUT_ONLY_LOOK_IDS.map((id) => {
        const metaRow = CHANNEL_LOOK_ELEMENTS.find(
          (element) => element.id === id,
        );
        return (
          <div key={id} className="border-border rounded-lg border p-3">
            <div className="mb-1 text-sm font-semibold">{metaRow?.label}</div>
            <LayoutOnlyLookHint elementId={id} />
          </div>
        );
      })}
    </div>
  ),
};

export const Releases: Story = {
  args: { elementId: 'releases' },
};

export const Tracks: Story = {
  args: { elementId: 'tracks' },
};

export const Gallery: Story = {
  args: { elementId: 'gallery' },
};
