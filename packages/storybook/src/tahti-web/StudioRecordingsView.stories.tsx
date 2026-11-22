import type { Meta, StoryObj } from '@storybook/react-vite';
import { StudioRecordingsView } from '@tahti-web/views/studio/StudioRecordingsView';
import { expect, userEvent, within } from 'storybook/test';

import {
  MOCK_USERS,
  withMockAuth,
  withPageSurface,
  withTahtiRouter,
} from './_lib/decorators';
import { expectVisible } from './_lib/play';

const meta: Meta<typeof StudioRecordingsView> = {
  title: 'Tahti/Studio/StudioRecordingsView',
  component: StudioRecordingsView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Studio → Recordings (`/studio/recordings`): every recorded broadcast, unpublished drafts pinned on top and the rest grouped by show, with search, sort and an edit action per recording, plus the Recording defaults panel (record and auto-publish new broadcasts).',
      },
    },
  },
  decorators: [
    withTahtiRouter('/studio/recordings'),
    withMockAuth(MOCK_USERS.artist),
    withPageSurface(),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { name: 'Recordings' }),
    ).toBeVisible();
    await expectVisible(
      await canvas.findByText(
        "2 recordings, grouped by show. Drafts that haven't been published yet are pinned at the top.",
      ),
    );
    await expect(
      (await canvas.findAllByText('Friday night set'))[0],
    ).toBeVisible();
    await expect(
      canvas.getByRole('link', { name: 'Browse shows' }),
    ).toHaveAttribute('href', '/studio/shows');
    await expect(
      canvas.getByRole('searchbox', { name: 'Search recordings' }),
    ).toBeVisible();
    await expect(canvas.getByText('Recording defaults')).toBeVisible();
    await expect(canvas.getByText('Record my broadcasts')).toBeVisible();
    await expect(
      canvas.getByText('Publish recordings automatically'),
    ).toBeVisible();
  },
};

export const NoSearchMatches: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findAllByText('Friday night set');
    await userEvent.type(
      canvas.getByRole('searchbox', { name: 'Search recordings' }),
      'zzz-no-such-show',
    );
    await expectVisible(
      await canvas.findByText('No recordings match your search'),
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Clear search' }));
    await expectVisible((await canvas.findAllByText('Friday night set'))[0]!);
  },
};
