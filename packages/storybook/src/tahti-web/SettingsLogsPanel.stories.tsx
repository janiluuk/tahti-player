import type { Meta, StoryObj } from '@storybook/react-vite';
import { clearClientLogs, logClientEvent } from '@tahti-web/lib/clientLogs';
import { LogsPanel } from '@tahti-web/views/settings/panels/LogsPanel';

import { withPageSurface } from './_lib/decorators';

const meta: Meta<typeof LogsPanel> = {
  title: 'Tahti/Settings/LogsPanel',
  component: LogsPanel,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Settings → Logs: in-memory client log buffer (console warnings/errors and app events) with search, level/scope filters, Clear and Export. Missing states: none beyond empty (the buffer is local).',
      },
    },
  },
  decorators: [withPageSurface()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const WithEntries: Story = {
  beforeEach: () => {
    clearClientLogs();
    logClientEvent('info', 'app', 'Tahti web starting');
    logClientEvent('info', 'queue', 'Restored 12 items from disk');
    logClientEvent('info', 'player', 'Now playing: Aurora Drift');
    logClientEvent('warn', 'console', 'Stream stalled, retrying');
    logClientEvent('error', 'player', 'Playback failed: network error');
  },
};

export const Empty: Story = {
  beforeEach: () => {
    clearClientLogs();
  },
};
