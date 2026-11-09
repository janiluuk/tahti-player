import type { Meta, StoryObj } from '@storybook/react-vite';
import { clearClientLogs, logClientEvent } from '@tahti-web/lib/clientLogs';
import { ClientLogsPanel } from '@tahti-web/views/admin/monitoring/ClientLogsPanel';

import { withPageSurface, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof ClientLogsPanel> = {
  title: 'Tahti/Admin/ClientLogsPanel',
  component: ClientLogsPanel,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Admin → Overview → Logs → Client logs: the log buffer of this browser tab. Missing states: none beyond empty (the buffer is local).',
      },
    },
  },
  decorators: [withTahtiRouter('/admin/logs?tab=client'), withPageSurface()],
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
