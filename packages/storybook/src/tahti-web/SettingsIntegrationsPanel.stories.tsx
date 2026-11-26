import type { Meta, StoryObj } from '@storybook/react-vite';
import { useDesktopDiscordStore } from '@tahti-web/lib/discord/presence';
import { useDesktopJamStore } from '@tahti-web/lib/jam/desktop';
import { useDesktopMcpStore } from '@tahti-web/lib/mcp/desktop';
import { useDesktopMpdStore } from '@tahti-web/lib/mpd/desktop';
import { IntegrationsPanel } from '@tahti-web/views/settings/panels/IntegrationsPanel';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { withMockAuth, withPageSurface } from './_lib/decorators';

const meta: Meta<typeof IntegrationsPanel> = {
  title: 'Tahti/Settings/IntegrationsPanel',
  component: IntegrationsPanel,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Settings → Playback → Integrations: ListenBrainz and Last.fm scrobbling in the web app. Desktop controls appear only inside the desktop app.',
      },
    },
  },
  decorators: [withPageSurface(), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const WebApp: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByText('Desktop app')).toBeNull();
    await expect(canvas.queryByText("Couldn't load integrations")).toBeNull();
    await expect(
      canvas.getByRole('switch', { name: 'Last.fm scrobbling' }),
    ).toBeVisible();
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
    await waitFor(() =>
      expect(canvas.getByText('http://127.0.0.1:8800/mcp')).toBeVisible(),
    );
    await userEvent.click(
      await canvas.findByRole('switch', { name: 'MPD server' }),
    );
    await waitFor(() =>
      expect(canvas.getByText('127.0.0.1:6600')).toBeVisible(),
    );
    await userEvent.click(
      await canvas.findByRole('switch', { name: 'Discord Rich Presence' }),
    );
    await expect(
      canvas.getByRole('switch', { name: 'Discord Rich Presence' }),
    ).toBeChecked();
    await userEvent.click(
      await canvas.findByRole('switch', { name: 'Tahti Jam' }),
    );
    await waitFor(() =>
      expect(canvas.getByLabelText('Tahti Jam pairing QR code')).toBeVisible(),
    );
    await expect(canvas.queryByText('Desktop app only')).toBeNull();
  },
};
