import type { Meta, StoryObj } from '@storybook/react-vite';
import { RadioCategory } from '@tahti-web/components/plugin-store/RadioCategory';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

/**
 * PluginStorePanel's Radio category, extracted to its own module
 * (`components/plugin-store/RadioCategory.tsx`): a personal stream URL
 * card, the community Radio Browser directory (50k+ public stations, off
 * by default here — `useRadioBrowserStore`'s `enabled` starts `false`,
 * matching production), and the curated Finnish stations list with a
 * "suggest a station" form.
 */
const meta: Meta<typeof RadioCategory> = {
  title: 'Tahti/Widgets/PluginStorePanel/Radio category',
  component: RadioCategory,
  parameters: { layout: 'padded' },
  decorators: [withTahtiRouter('/studio'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Radio Browser directory starts deactivated (real default) — click its
// gear to expand and Activate to load the live station search.
export const Default: Story = {};
