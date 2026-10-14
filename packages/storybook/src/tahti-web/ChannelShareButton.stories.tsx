import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChannelShareButton } from '@tahti-web/components/ChannelShareButton';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { expectNoDialog, findDialog, openDialog } from './_lib/play';

const meta: Meta<typeof ChannelShareButton> = {
  title: 'Tahti/Channel/ChannelShareButton',
  component: ChannelShareButton,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { channelSlug: 'northern-lights', displayName: 'Northern Lights' },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const IconOnly: Story = {
  play: async ({ canvasElement }) => {
    const dialog = await openDialog(
      canvasElement,
      'Share Northern Lights',
      'Share channel',
    );
    await expect(
      dialog.getByText(`${window.location.origin}/channel/northern-lights`),
    ).toBeVisible();
    await expect(
      dialog.getByText('Listen to Northern Lights on Tahti', {
        selector: 'p',
      }),
    ).toBeVisible();
    await expect(
      dialog.getByRole('link', { name: 'Share on X' }),
    ).toHaveAttribute('href', expect.stringContaining('twitter.com/intent'));
    await expect(
      dialog.getByText(`${window.location.origin}/embed/c/northern-lights`),
    ).toBeVisible();
    await waitFor(() =>
      expect(
        dialog.getByRole('button', { name: 'Copy playlist link' }),
      ).toBeEnabled(),
    );
    await userEvent.click(
      dialog.getAllByRole('button', { name: 'Close' }).at(-1)!,
    );
    await expectNoDialog(canvasElement);
  },
};

export const WithLabel: Story = {
  args: { iconOnly: false },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', {
      name: 'Share Northern Lights',
    });
    await expect(button).toHaveTextContent('Share');
    await userEvent.click(button);
    const dialog = await findDialog(canvasElement, 'Share channel');
    await expect(
      dialog.getByRole('button', { name: 'Copy iframe code' }),
    ).toBeVisible();
  },
};
