import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChannelAnnouncementsPanel } from '@tahti-web/components/ChannelAnnouncementsPanel';

const meta: Meta<typeof ChannelAnnouncementsPanel> = {
  title: 'Tahti/Studio/ChannelAnnouncementsPanel',
  component: ChannelAnnouncementsPanel,
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
