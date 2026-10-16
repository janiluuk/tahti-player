import type { Meta, StoryObj } from '@storybook/react-vite';
import { useDesktopDiscordStore } from '@tahti-web/lib/discord/presence';
import { useDesktopJamStore } from '@tahti-web/lib/jam/desktop';
import { useDesktopMcpStore } from '@tahti-web/lib/mcp/desktop';
import { useDesktopMpdStore } from '@tahti-web/lib/mpd/desktop';
import { IntegrationsPanel } from '@tahti-web/views/settings/panels/IntegrationsPanel';
import { expect, userEvent, within } from 'storybook/test';

import { withMockAuth, withPageSurface } from './_lib/decorators';
import { mockData } from './_lib/mock-data';

const meta: Meta<typeof IntegrationsPanel> = {
  title: 'Tahti/Settings/IntegrationsPanel',
  component: IntegrationsPanel,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Settings → Integrations: ListenBrainz and Last.fm scrobble toggles (mock integrations API in Storybook), plus Jam, MCP, MPD and Discord Rich Presence listed as desktop-app only. In the desktop app Tahti Jam, MCP, MPD and Discord are working switches; the servers show their address, and Jam a pairing QR code.',
      },
    },
  },
  decorators: [withPageSurface(), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Mock fetchMeIntegrations throws via meIntegrations override (no ESM spyOn). */
export const IntegrationsApiError: Story = {
  parameters: {
    mockData: mockData({
      meIntegrations: () => {
        throw new Error('Service unavailable');
      },
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText("Couldn't load integrations"),
    ).toBeVisible();
    await expect(canvas.getByText('Service unavailable')).toBeVisible();
  },
};

const off = { enabled: false, url: null, error: null };

/** The desktop app: Tahti Jam, MCP, MPD and Discord are switches; the servers show their address, and Jam a pairing QR code. */
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
    globalThis.__TAHTI_NATIVE_JAM__ = {
      start: async () => ({ port: 4120, lanAddress: '192.168.1.20' }),
      stop: async () => {},
      send: () => {},
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
    useDesktopJamStore.setState(off);
    return () => {
      globalThis.__TAHTI_NATIVE_MCP__ = undefined;
      globalThis.__TAHTI_NATIVE_MPD__ = undefined;
      globalThis.__TAHTI_NATIVE_DISCORD__ = undefined;
      globalThis.__TAHTI_NATIVE_JAM__ = undefined;
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
    await userEvent.click(
      await canvas.findByRole('switch', { name: 'Tahti Jam' }),
    );
    await expect(
      await canvas.findByLabelText('Tahti Jam pairing QR code'),
    ).toBeVisible();
    await expect(canvas.queryByText('Desktop app only')).toBeNull();
  },
};
