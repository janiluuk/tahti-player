import type { Meta, StoryObj } from '@storybook/react-vite';
import type { AdminAddonRegisterInput } from '@tahti-web/api/admin';
import { RegisterDialog } from '@tahti-web/views/admin/addons/RegisterDialog';
import { EMPTY_DRAFT } from '@tahti-web/views/admin/addons/shared';
import { useState, type ComponentProps } from 'react';
import { expect, fn, userEvent, waitFor } from 'storybook/test';

import { findDialog } from './_lib/play';

type Props = ComponentProps<typeof RegisterDialog>;

/** The dialog is controlled; the admin view owns the draft. */
function StatefulRegisterDialog(props: Props) {
  const [draft, setDraft] = useState<AdminAddonRegisterInput>(props.draft);
  return (
    <RegisterDialog
      {...props}
      draft={draft}
      onChange={(next) => {
        setDraft(next);
        props.onChange(next);
      }}
    />
  );
}

const FILLED_DRAFT: AdminAddonRegisterInput = {
  slug: 'channel-stats',
  scope: 'ARTIST',
  name: 'Channel stats',
  description: 'Shows the artist channel’s current listener statistics.',
  authorName: 'Tahti',
  categories: ['stats', 'social'],
  iconUrl: '',
};

const meta: Meta<typeof RegisterDialog> = {
  title: 'Tahti/Admin/AdminAddonRegisterDialog',
  component: RegisterDialog,
  tags: ['autodocs'],
  args: {
    isOpen: true,
    draft: EMPTY_DRAFT,
    pending: false,
    error: null,
    onChange: fn(),
    onClose: fn(),
    onSave: fn(),
  },
  render: (args) => <StatefulRegisterDialog {...args} />,
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Register stays disabled until every required field is filled. */
export const Register: Story = {
  play: async ({ args, canvasElement }) => {
    const dialog = await findDialog(canvasElement, 'Register a new add-on');
    const register = dialog.getByRole('button', { name: 'Register add-on' });
    await expect(register).toBeDisabled();

    await userEvent.type(dialog.getByLabelText('Slug'), 'live-status');
    await userEvent.type(dialog.getByLabelText('Name'), 'Live status');
    await userEvent.type(
      dialog.getByPlaceholderText('What does this add-on show or do?'),
      'Which channels are on air.',
    );
    await userEvent.type(dialog.getByLabelText('Author'), 'Tahti');
    await expect(register).toBeDisabled();
    // Pasted, not typed: the field re-joins categories on every keystroke,
    // so a typed trailing comma is dropped before the next word arrives.
    await userEvent.click(dialog.getByLabelText('Parameters / categories'));
    await userEvent.paste('status, live');
    await waitFor(() => expect(register).toBeEnabled());
    await expect(args.onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        slug: 'live-status',
        name: 'Live status',
        categories: ['status', 'live'],
      }),
    );
    await userEvent.click(register);
    await expect(args.onSave).toHaveBeenCalled();
  },
};

/** Editing keeps the slug and type as registered. */
export const Edit: Story = {
  args: { editing: 'channel-stats', draft: FILLED_DRAFT },
  play: async ({ canvasElement }) => {
    const dialog = await findDialog(canvasElement, 'Edit channel-stats');
    await expect(dialog.getByLabelText('Slug')).toBeDisabled();
    await expect(dialog.getByLabelText('Name')).toHaveValue('Channel stats');
    await expect(dialog.getByLabelText('Parameters / categories')).toHaveValue(
      'stats, social',
    );
    await expect(
      dialog.getByRole('button', { name: 'Save changes' }),
    ).toBeEnabled();
  },
};

export const SlugTaken: Story = {
  args: {
    draft: FILLED_DRAFT,
    error: 'An add-on with this slug already exists',
  },
  play: async ({ canvasElement }) => {
    const dialog = await findDialog(canvasElement, 'Register a new add-on');
    await expect(dialog.getByRole('alert')).toHaveTextContent(
      'An add-on with this slug already exists',
    );
  },
};
