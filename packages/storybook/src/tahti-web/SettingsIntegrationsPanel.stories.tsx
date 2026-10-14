import type { Meta, StoryObj } from '@storybook/react-vite';
import { useDesktopDiscordStore } from '@tahti-web/lib/discord/presence';
import { useDesktopMcpStore } from '@tahti-web/lib/mcp/desktop';
import { useDesktopMpdStore } from '@tahti-web/lib/mpd/desktop';
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
          'Settings → Integrations: ListenBrainz and Last.fm scrobble toggles (mock integrations API in Storybook), plus Jam, MCP, MPD and Discord Rich Presence listed as desktop-app only. In the desktop app MCP, MPD and Discord are working switches; the servers show their address. Missing states: integrations API error.',
      },
    },
  },
  decorators: [withPageSurface(), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

const off = { enabled: false, url: null, error: null };

/** The desktop app: MCP, MPD and Discord are switches; the servers show their address. */
export const DesktopApp: Story = {
  beforeEach: () => {
    globalThis.__TAHTI_NATIVE_MCP__ = {
      start: async () => 8800,
      stop: async () => {},
    };
    globalThis.__TAHTI_NATIVE_MPD__ = {
      start: async () => 6600,
      stop: async () => {},
      notify: () => {},
    };
    globalThis.__TAHTI_NATIVE_DISCORD__ = {
      start: async () => {},
      stop: async () => {},
      setActivity: async () => false,
      clearActivity: async () => {},
    };
    useDesktopMcpStore.setState(off);
    useDesktopMpdStore.setState(off);
    useDesktopDiscordStore.setState(off);
    return () => {
      globalThis.__TAHTI_NATIVE_MCP__ = undefined;
      globalThis.__TAHTI_NATIVE_MPD__ = undefined;
      globalThis.__TAHTI_NATIVE_DISCORD__ = undefined;
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
    await userEvent.click(
      await canvas.findByRole('switch', { name: 'MPD server' }),
    );
    await expect(await canvas.findByText('127.0.0.1:6600')).toBeVisible();
    await userEvent.click(
      await canvas.findByRole('switch', { name: 'Discord Rich Presence' }),
    );
    await expect(
      canvas.getByRole('switch', { name: 'Discord Rich Presence' }),
    ).toBeChecked();
    await expect(canvas.queryByText('Desktop app only')).toBeVisible();
  },
};
