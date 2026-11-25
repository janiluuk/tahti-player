import type { Meta, StoryObj } from '@storybook/react-vite';
import { StudioChannelClipsView } from '@tahti-web/views/studio/StudioChannelClipsView';
import { expect, userEvent, within } from 'storybook/test';

import {
  MOCK_USERS,
  withMockAuth,
  withPageSurface,
  withTahtiRouter,
} from './_lib/decorators';
import { expectNoDialog, findDialog } from './_lib/play';

const meta: Meta<typeof StudioChannelClipsView> = {
  title: 'Tahti/Studio/StudioChannelClipsView',
  component: StudioChannelClipsView,
  parameters: { layout: 'fullscreen' },
  decorators: [
    withPageSurface(),
    withMockAuth(MOCK_USERS.artist),
    withTahtiRouter('/studio/channel/clips'),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { name: 'Clips between programs' }),
    ).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Upload audio' }));
    const upload = await findDialog(canvasElement, 'Upload audio');
    await expect(upload.getAllByText(/up to 10 minutes/)).toHaveLength(2);
    await userEvent.keyboard('{Escape}');
    await expectNoDialog(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Record voice' }));
    const record = await findDialog(canvasElement, 'Record voice');
    await expect(
      record.getByRole('button', { name: 'Record voice' }),
    ).toBeInTheDocument();
  },
};
