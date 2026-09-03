import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminGate } from '@tahti-web/components/AdminGate';

import { ADMIN_SWEEP_DOCS } from './_lib/adminStoryDocs';
import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AdminGate> = {
  title: 'Tahti/Admin/AdminGate',
  component: AdminGate,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `${ADMIN_SWEEP_DOCS} Access gate, not a primitive swap target.`,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/admin')],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SignedOut: Story = {
  decorators: [withMockAuth(null)],
  args: {
    children: <p>You should not see this — gated content.</p>,
  },
};

export const WrongRole: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  args: {
    children: <p>You should not see this — gated content.</p>,
  },
};

export const BoardMember: Story = {
  decorators: [withMockAuth(MOCK_USERS.board)],
  args: {
    children: (
      <p className="rounded-md border border-dashed p-4 text-sm">
        Board access granted — admin content renders here.
      </p>
    ),
  },
};
