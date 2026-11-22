import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatusView } from '@tahti-web/views/StatusView';
import { expect, within } from 'storybook/test';

import {
  withMockAuth,
  withPageSurface,
  withTahtiRouter,
} from './_lib/decorators';

const meta: Meta<typeof StatusView> = {
  title: 'Tahti/Misc/StatusView',
  component: StatusView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Public platform status (`/status`, linked from the Help center): overall API state, version, uptime and check time, one row per health check (critical dependencies starred) and the client build (version, tag date, deploy time).',
      },
    },
  },
  decorators: [
    withTahtiRouter('/status'),
    withMockAuth(null),
    withPageSurface(),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Healthy: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { name: 'Status' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('link', { name: /Help center/ }),
    ).toHaveAttribute('href', '/help');
    await expect(await canvas.findByText('OK')).toBeVisible();
    await expect(canvas.getByText('60 min')).toBeVisible();

    const table = canvas.getByRole('table');
    for (const header of ['Check', 'State', 'Latency', 'Detail']) {
      await expect(
        within(table).getByRole('columnheader', { name: header }),
      ).toBeVisible();
    }
    await expect(
      within(table).getByRole('cell', { name: 'postgres *' }),
    ).toBeVisible();
    await expect(
      within(table).getByRole('cell', { name: 'minio' }),
    ).toBeVisible();
    await expect(
      within(table).getByRole('cell', { name: '5 ms' }),
    ).toBeVisible();
    await expect(canvas.getByText('* Critical dependency')).toBeVisible();
    await expect(canvas.getByText('Client version')).toBeVisible();
    await expect(canvas.getByText('Deployed')).toBeVisible();
  },
};
