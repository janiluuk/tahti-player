import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChannelEditToolbar } from '@tahti-web/components/channel-view/ChannelEditToolbar';
import { expect, fn, userEvent, within } from 'storybook/test';

/** Header row of ChannelView's editing mode: dirty state, layers-menu
 * toggle (mobile only), Save changes and Done. */
const meta: Meta<typeof ChannelEditToolbar> = {
  title: 'Tahti/Channel/Designer/EditToolbar',
  component: ChannelEditToolbar,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    dirty: true,
    note: null,
    saving: false,
    mobileMenuOpen: false,
    onToggleMobileMenu: fn(),
    onSave: fn(),
    onDone: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const UnsavedChanges: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/unsaved changes/)).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Save changes' }));
    await expect(args.onSave).toHaveBeenCalledOnce();
    await userEvent.click(canvas.getByRole('button', { name: 'Done' }));
    await expect(args.onDone).toHaveBeenCalledOnce();
  },
};

export const SavedWithNote: Story = {
  name: 'Saved, with a note',
  args: {
    dirty: false,
    note: 'Look changes are saved to your channel; layout stays in this browser.',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/saved locally/)).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Save changes' }),
    ).toBeDisabled();
  },
};

export const Saving: Story = {
  args: { saving: true },
};

export const MobileMenuOpen: Story = {
  name: 'Layers menu open (toggle shows below the sm breakpoint)',
  args: { mobileMenuOpen: true },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText('Hide menu'),
    ).toBeInTheDocument();
  },
};
