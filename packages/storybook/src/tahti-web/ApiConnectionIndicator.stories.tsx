import type { Meta, StoryObj } from '@storybook/react-vite';
import { ApiConnectionIndicator } from '@tahti-web/components/ApiConnectionIndicator';

/**
 * Renders nothing while `GET {apiBase()}/health` looks healthy, and a red
 * "API disconnected" pill once it fails. Storybook always runs with
 * `VITE_FORCE_MOCK=1` (see .storybook/main.ts), which makes the component's
 * real health probe a permanent no-op — `Failed` below uses the
 * Storybook-only `previewFailed` prop to preview the pill without one. Not
 * currently mounted anywhere in the app chrome (built ahead of being wired
 * in).
 */
const meta: Meta<typeof ApiConnectionIndicator> = {
  title: 'Tahti/Chrome/API connection',
  component: ApiConnectionIndicator,
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Connected: Story = {};

export const Failed: Story = {
  args: { previewFailed: true },
};
