import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminGate } from '@tahti-web/components/AdminGate';
import { useAuthModalStore } from '@tahti-web/stores/authModalStore';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AdminGate> = {
  title: 'Tahti/Admin/AdminGate',
  component: AdminGate,
  parameters: { layout: 'padded' },
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Board admin')).toBeVisible();
    await expect(canvas.queryByText(/gated content/)).toBeNull();
    useAuthModalStore.setState({ isOpen: false });
    await userEvent.click(canvas.getByRole('button', { name: 'Log in' }));
    await waitFor(() =>
      expect(useAuthModalStore.getState()).toMatchObject({
        isOpen: true,
        mode: 'login',
      }),
    );
    useAuthModalStore.setState({ isOpen: false });
  },
};

export const WrongRole: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  args: {
    children: <p>You should not see this — gated content.</p>,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Board access required')).toBeVisible();
    await expect(
      canvas.getByText(
        "Signed in as @listener-liina, but this account doesn't have the Board role.",
      ),
    ).toBeVisible();
    await expect(
      canvas.getByRole('link', { name: 'Back to Listen' }),
    ).toHaveAttribute('href', '/');
    await expect(canvas.queryByText(/gated content/)).toBeNull();
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
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText(
        'Board access granted — admin content renders here.',
      ),
    ).toBeVisible();
  },
};
