import type { Meta, StoryObj } from '@storybook/react-vite';
import { useDesktopMcpStore } from '@tahti-web/lib/mcp/desktop';
import { IntegrationsPanel } from '@tahti-web/views/settings/panels/IntegrationsPanel';
import { expect, userEvent, within } from 'storybook/test';

import { withMockAuth, withPageSurface } from './_lib/decorators';

const meta: Meta<typeof IntegrationsPanel> = {
  title: 'Tahti/Settings/IntegrationsPanel',
  component: IntegrationsPanel,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Settings → Integrations: ListenBrainz and Last.fm scrobble toggles (mock integrations API in Storybook), plus Jam, MCP, MPD and Discord Rich Presence listed as desktop-app only. In the desktop app the MCP row is a working toggle with the server URL. Missing states: integrations API error.',
      },
    },
  },
  decorators: [withPageSurface(), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** The desktop app: the MCP server can be switched on and shows its URL. */
export const DesktopApp: Story = {
  beforeEach: () => {
    globalThis.__TAHTI_NATIVE_MCP__ = {
      start: async () => 8800,
      stop: async () => {},
    };
    useDesktopMcpStore.setState({ enabled: false, url: null, error: null });
    return () => {
      globalThis.__TAHTI_NATIVE_MCP__ = undefined;
    };
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole('switch', { name: 'MCP server' }),
    );
    await expect(
      await canvas.findByText('http://127.0.0.1:8800/mcp'),
    ).toBeVisible();
  },
};
