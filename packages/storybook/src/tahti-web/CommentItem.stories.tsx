import type { Meta, StoryObj } from '@storybook/react-vite';
import { CommentItem } from '@tahti-web/components/CommentItem';
import { expect, fn, userEvent, within } from 'storybook/test';

import { MOCK_USERS, withMockAuth } from './_lib/decorators';
import { findDialog } from './_lib/play';

const COMMENT = {
  id: 'comment-1',
  body: 'That bassline at the drop is unreal.',
  authorUsername: 'aurora-fan',
  authorDisplayName: 'Aurora Fan',
  authorAvatarUrl: null,
  createdAt: '2026-09-28T19:30:00.000Z',
};

const meta: Meta<typeof CommentItem> = {
  title: 'Tahti/Track/CommentItem',
  component: CommentItem,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'One track or channel comment. Other people\'s comments carry a Report button that opens the report dialog on "Harassment or abuse"; your own comment has none. The delete button shows when the caller passes `onDelete` (the author, the track or channel owner).',
      },
    },
  },
  tags: ['autodocs'],
  args: { comment: COMMENT },
  decorators: [
    (Story) => (
      <ul className="flex max-w-xl flex-col gap-4">
        <Story />
      </ul>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** A visitor reading someone else's comment: Report only. */
export const SomeoneElses: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Aurora Fan')).toBeVisible();
    await expect(
      canvas.queryByRole('button', { name: /Delete comment/ }),
    ).toBeNull();
    await userEvent.click(
      canvas.getByRole('button', { name: 'Report comment by Aurora Fan' }),
    );
    const dialog = await findDialog(canvasElement, /Report comment by/);
    await expect(dialog.getByText('Harassment or abuse')).toBeVisible();
    await userEvent.click(dialog.getByRole('button', { name: 'Cancel' }));
  },
};

/** The track or channel owner: Report and Delete. */
export const AsOwner: Story = {
  args: { onDelete: fn() },
  decorators: [withMockAuth(MOCK_USERS.artist)],
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: 'Delete comment by Aurora Fan' }),
    );
    await expect(args.onDelete).toHaveBeenCalled();
  },
};

/** Your own comment: Delete, and no Report button. */
export const YourOwn: Story = {
  args: {
    onDelete: fn(),
    comment: {
      ...COMMENT,
      authorUsername: MOCK_USERS.listener.username,
      authorDisplayName: MOCK_USERS.listener.displayName ?? 'You',
    },
  },
  decorators: [withMockAuth(MOCK_USERS.listener)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('button', { name: /^Report/ })).toBeNull();
    await expect(
      canvas.getByRole('button', { name: /Delete comment/ }),
    ).toBeVisible();
  },
};

/** Signed out: Report still works, since reporting needs no account. */
export const SignedOut: Story = {
  decorators: [withMockAuth(null)],
};

/** A timed comment: the caller strips the timestamp and passes a jump link. */
export const WithMeta: Story = {
  args: {
    text: 'Nice drop',
    meta: <span className="text-primary text-sm tabular-nums">1:30</span>,
  },
  decorators: [withMockAuth(MOCK_USERS.listener)],
};

/** While the delete request is in flight. */
export const Deleting: Story = {
  args: { onDelete: fn(), deleting: true },
  decorators: [withMockAuth(MOCK_USERS.artist)],
};
