import type { Meta, StoryObj } from '@storybook/react-vite';
import { MyVenuesView } from '@tahti-web/views/MyVenuesView';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof MyVenuesView> = {
  title: 'Tahti/Discover/MyVenuesView',
  component: MyVenuesView,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          '`/venues/mine` - venues the signed-in user registered (`GET /api/me/venues`), each marked verified or waiting for the board.',
      },
    },
  },
  decorators: [withTahtiRouter('/venues/mine')],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Owner: Story = {
  decorators: [withMockAuth(MOCK_USERS.artist)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { name: 'Northern Lights Hall' }),
    ).toBeVisible();
    await expect(canvas.getByText('Verified')).toBeVisible();
  },
};

export const SignedOut: Story = {
  decorators: [withMockAuth(null)],
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByText('Sign in to manage your venues'),
    ).toBeVisible();
  },
};

export const EditDetails: Story = {
  decorators: [withMockAuth(MOCK_USERS.artist)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Edit details' }),
    );
    const capacity = canvas.getByLabelText('Capacity');
    await userEvent.clear(capacity);
    await userEvent.type(capacity, '150');
    await userEvent.click(canvas.getByRole('button', { name: 'Save details' }));
    await expect(
      await canvas.findByRole('button', { name: 'Edit details' }),
    ).toBeVisible();
  },
};

export const BookShow: Story = {
  decorators: [withMockAuth(MOCK_USERS.artist)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const existing = await canvas.findByText('Album release show');
    await waitFor(() => expect(existing).toBeVisible());
    await userEvent.click(canvas.getByRole('button', { name: 'Book a show' }));
    await userEvent.type(canvas.getByLabelText('Starts'), '2030-01-15T20:00');
    await userEvent.type(
      canvas.getByLabelText('What is on (optional)'),
      'Winter club night',
    );
    await userEvent.click(
      canvas.getByRole('button', { name: 'Book the show' }),
    );
    await expect(await canvas.findByText('Winter club night')).toBeVisible();
  },
};

export const CancelShow: Story = {
  decorators: [withMockAuth(MOCK_USERS.artist)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('Album release show')).toBeVisible();
    const [first] = canvas.getAllByRole('button', { name: /^Cancel show on/ });
    await userEvent.click(first!);
    const dialog = within(
      await within(canvasElement.ownerDocument.body).findByRole('dialog'),
    );
    await userEvent.click(dialog.getByRole('button', { name: 'Cancel show' }));
    await waitFor(() =>
      expect(canvas.queryByText('Album release show')).toBeNull(),
    );
  },
};
