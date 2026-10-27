import type { Meta, StoryObj } from '@storybook/react-vite';
import { PlayHistoryDialog } from '@tahti-web/components/PlayHistoryDialog';
import { humanizePastDate } from '@tahti-web/lib/humanizeDate';
import { playedAtDate } from '@tahti-web/lib/setTracklist';
import { expect, fn, within } from 'storybook/test';

import { DJ_PLAY_HISTORY, djLibrary } from './_fixtures/dj-library';

const meta: Meta<typeof PlayHistoryDialog> = {
  title: 'Tahti/Desktop/PlayHistoryDialog',
  component: PlayHistoryDialog,
  args: {
    isOpen: true,
    onClose: fn(),
    onChanged: fn(),
    library: djLibrary(),
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const LastSession: Story = {
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const resume = await body.findByRole('button', { name: 'Resume' });
    await expect(resume).toBeEnabled();
    await expect(
      body.getByRole('button', { name: 'Clear history' }),
    ).toBeEnabled();
    await expect(
      body.queryByRole('button', { name: /Copy last session/ }),
    ).toBeNull();
    await expect(body.queryByRole('button', { name: 'Done' })).toBeNull();
    const newest = DJ_PLAY_HISTORY[0]!;
    const row = body.getByText(/Sauna Steam/).closest('li')!;
    await expect(
      within(row).getByText(
        humanizePastDate(playedAtDate(newest.playedAt)!.toISOString()),
      ),
    ).toBeVisible();
    await expect(body.queryByText(`${newest.playedAt} UTC`)).toBeNull();
  },
};

export const Empty: Story = {
  args: { library: djLibrary({ history: [] }) },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await expect(await body.findByText(/Nothing yet/)).toBeVisible();
    await expect(body.getByRole('button', { name: 'Resume' })).toBeDisabled();
    await expect(
      body.getByRole('button', { name: 'Clear history' }),
    ).toBeDisabled();
  },
};
