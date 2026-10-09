import type { Meta, StoryObj } from '@storybook/react-vite';
import { PreviewTracksPlaceholder } from '@tahti-web/components/channel-designer/PreviewTracksPlaceholder';
import { expect, within } from 'storybook/test';

/** Static tracks + bio rows under the designer's live page preview. */
const meta: Meta<typeof PreviewTracksPlaceholder> = {
  title: 'Tahti/Channel/Designer/PreviewTracksPlaceholder',
  component: PreviewTracksPlaceholder,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    displayName: 'Northern Lights',
    bio: 'Ambient / downtempo, streaming most weeknights.',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const WithBio: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Latest release')).toBeVisible();
    await expect(canvas.getByText('About Northern Lights')).toBeVisible();
    await expect(
      canvas.getByText('Ambient / downtempo, streaming most weeknights.'),
    ).toBeVisible();
  },
};

export const NoBio: Story = {
  name: 'No bio (placeholder copy)',
  args: { bio: null },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText(
        'Your artist bio will appear here for visitors.',
      ),
    ).toBeVisible();
  },
};
