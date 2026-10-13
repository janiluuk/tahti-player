import type { Meta, StoryObj } from '@storybook/react-vite';
import { DesignerToolbar } from '@tahti-web/components/channel-designer/DesignerToolbar';
import { Link } from '@tanstack/react-router';
import { expect, fn, userEvent, within } from 'storybook/test';

import { SaveButton } from '@tahti-player/ui';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';
import { withinBody } from './_lib/play';

/** The row above the designer's live preview: more-options menu (Save
 * preset / Reset), restore previous save, Save layout and the channel link. */
const meta: Meta<typeof DesignerToolbar> = {
  title: 'Tahti/Channel/Designer/Toolbar',
  component: DesignerToolbar,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [
    withTahtiRouter('/settings/artist?tab=channel-designer'),
    withMockAuth(MOCK_USERS.artist),
  ],
  args: {
    dirty: true,
    hasPreviousSave: true,
    onOpenSavePresetModal: fn(),
    onRequestReset: fn(),
    onRestorePreviousSave: fn(),
  },
  render: (args) => (
    <DesignerToolbar
      {...args}
      saveButton={
        <SaveButton
          disabled={!args.dirty}
          saving={false}
          label="Save layout"
          savingLabel="Saving layout…"
          onClick={() => undefined}
        />
      }
      openChannelLink={
        <Link
          to="/channel/$slug"
          params={{ slug: 'northern-lights' }}
          className="text-primary text-sm font-semibold underline-offset-2 hover:underline"
        >
          Open my channel →
        </Link>
      }
    />
  ),
};

export default meta;
type Story = StoryObj<typeof meta>;

export const UnsavedChanges: Story = {
  name: 'Unsaved changes + previous save',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('button', { name: 'Save layout' }),
    ).toBeEnabled();

    await userEvent.click(
      canvas.getByRole('button', { name: 'Restore previous save' }),
    );
    await expect(args.onRestorePreviousSave).toHaveBeenCalledOnce();

    await userEvent.click(canvas.getByRole('button', { name: 'More options' }));
    await userEvent.click(
      await withinBody(canvasElement).findByRole('button', {
        name: 'Save preset',
      }),
    );
    await expect(args.onOpenSavePresetModal).toHaveBeenCalledOnce();

    await userEvent.click(canvas.getByRole('button', { name: 'More options' }));
    await userEvent.click(
      await withinBody(canvasElement).findByRole('button', { name: 'Reset' }),
    );
    await expect(args.onRequestReset).toHaveBeenCalledOnce();
  },
};

export const Saved: Story = {
  name: 'Saved (nothing to reset)',
  args: { dirty: false, hasPreviousSave: false },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.queryByRole('button', { name: 'Restore previous save' }),
    ).toBeNull();
    await expect(
      canvas.getByRole('button', { name: 'Save layout' }),
    ).toBeDisabled();
    await userEvent.click(canvas.getByRole('button', { name: 'More options' }));
    const reset = await withinBody(canvasElement).findByRole('button', {
      name: 'Reset',
    });
    await expect(reset).toBeDisabled();
    await expect(args.onRequestReset).not.toHaveBeenCalled();
  },
};
