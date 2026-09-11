import type { Meta, StoryObj } from '@storybook/react-vite';
import { MulticastSection } from '@tahti-web/components/MulticastSection';

/**
 * Settings → Add-ons → Multistream: RTMP destinations as thumbnails
 * (Sources-style), sharing `MulticastConfigureDialog` for add/edit.
 * Fetches `/api/me/rtmp-targets`; falls back to fixture destinations in
 * dev/Storybook when the API isn't reachable (`allowMockFallback`).
 */
const meta: Meta<typeof MulticastSection> = {
  title: 'Tahti/Broadcast/MulticastSection',
  component: MulticastSection,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
