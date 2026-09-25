import type { Meta, StoryObj } from '@storybook/react-vite';
import { IntegrationsPanel } from '@tahti-web/views/settings/panels/IntegrationsPanel';

import { withMockAuth, withPageSurface } from './_lib/decorators';

const meta: Meta<typeof IntegrationsPanel> = {
  title: 'Tahti/Settings/IntegrationsPanel',
  component: IntegrationsPanel,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Settings → Integrations: ListenBrainz and Last.fm scrobble toggles (mock integrations API in Storybook), plus Jam, MCP, MPD and Discord Rich Presence listed as desktop-app only. Missing states: integrations API error.',
      },
    },
  },
  decorators: [withPageSurface(), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
