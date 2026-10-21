import type { Meta, StoryObj } from '@storybook/react-vite';
import { ReportButton } from '@tahti-web/components/ReportButton';
import { expect, userEvent, within } from 'storybook/test';

import { Toaster } from '@tahti-player/ui';

import { expectNoDialog, findDialog, findToast } from './_lib/play';

const meta: Meta<typeof ReportButton> = {
  title: 'Tahti/Misc/ReportButton',
  component: ReportButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Flags a track, release, channel, collection or comment for the board. No account is needed. The comment variant uses the text button and starts on "Harassment or abuse".',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <>
        <Story />
        <Toaster />
      </>
    ),
  ],
  args: {
    targetType: 'SOUND_ITEM',
    targetId: 'arch-mock-1',
    label: 'Night Drive',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/** On a track, release, channel or collection page. */
export const Track: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Report Night Drive' }),
    );
    const dialog = await findDialog(canvasElement, 'Report Night Drive');
    await expect(dialog.getByText('Copyright infringement')).toBeVisible();
    await userEvent.type(
      dialog.getByLabelText('Details'),
      'Re-upload of my track',
    );
    await userEvent.click(dialog.getByRole('button', { name: 'Send report' }));
    await findToast(canvasElement, /Report sent/);
    await expectNoDialog(canvasElement);
  },
};

/** On someone else's comment. */
export const Comment: Story = {
  args: {
    targetType: 'COMMENT',
    targetId: 'comment-1',
    label: 'comment by Aurora Fan',
    defaultReason: 'HARASSMENT',
    variant: 'text',
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', {
        name: 'Report comment by Aurora Fan',
      }),
    );
    const dialog = await findDialog(
      canvasElement,
      'Report comment by Aurora Fan',
    );
    await expect(dialog.getByText('Harassment or abuse')).toBeVisible();
    await userEvent.click(dialog.getByRole('button', { name: 'Cancel' }));
    await expectNoDialog(canvasElement);
  },
};
