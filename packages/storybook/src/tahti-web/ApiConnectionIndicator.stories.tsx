import type { Meta, StoryObj } from '@storybook/react-vite';
import { ApiConnectionIndicator } from '@tahti-web/components/ApiConnectionIndicator';

/**
 * Renders nothing while `GET {apiBase()}/health` looks healthy, and a red
 * "API disconnected" pill once it fails. Storybook has no live Tahti API
 * behind it, so the probe's request to `/tahti-api/health` 404s almost
 * immediately and the pill appears — the same as it would in production
 * against an unreachable API. Not currently mounted anywhere in the app
 * chrome (built ahead of being wired in).
 */
const meta: Meta<typeof ApiConnectionIndicator> = {
  title: 'Tahti/Chrome/API connection',
  component: ApiConnectionIndicator,
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
