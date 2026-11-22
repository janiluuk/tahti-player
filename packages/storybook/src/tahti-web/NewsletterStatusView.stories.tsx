import type { Meta, StoryObj } from '@storybook/react-vite';
import { NewsletterStatusView } from '@tahti-web/views/NewsletterStatusView';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import {
  withMockAuth,
  withPageSurface,
  withTahtiRouter,
} from './_lib/decorators';

const meta: Meta<typeof NewsletterStatusView> = {
  title: 'Tahti/Misc/NewsletterStatusView',
  component: NewsletterStatusView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Landing pages for artist newsletter emails: `/newsletter/confirmed` and `/newsletter/unsubscribed` (the API redirects confirmation and one-click unsubscribe links here) and `/newsletter/unsubscribe/$token` (the email footer link), which asks before unsubscribing.',
      },
    },
  },
  decorators: [withMockAuth(null), withPageSurface()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Confirmed: Story = {
  args: { status: { kind: 'confirmed' } },
  decorators: [withTahtiRouter('/newsletter/confirmed')],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { name: "You're subscribed" }),
    ).toBeVisible();
    await expect(
      canvas.getByText(
        "Thanks for confirming. You'll get the artist's updates by email, and every email has a link to stop them.",
      ),
    ).toBeVisible();
    await expect(
      canvas.getByRole('link', { name: 'Go to Tahti' }),
    ).toHaveAttribute('href', '/');
  },
};

export const Unsubscribed: Story = {
  args: { status: { kind: 'unsubscribed' } },
  decorators: [withTahtiRouter('/newsletter/unsubscribed')],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { name: "You're unsubscribed" }),
    ).toBeVisible();
    await expect(
      canvas.getByText(
        "You won't get this artist's newsletter any more. You can subscribe again from their page.",
      ),
    ).toBeVisible();
  },
};

// The story router only knows this route, so after a successful unsubscribe
// the navigate to `/newsletter/unsubscribed` leaves the page as it is; the
// play checks the request ran without an error instead.
export const UnsubscribeFromEmailLink: Story = {
  args: { status: { kind: 'unsubscribe', token: 'mock-unsubscribe-token' } },
  decorators: [
    withTahtiRouter('/newsletter/unsubscribe/mock-unsubscribe-token'),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { name: 'Stop these emails?' }),
    ).toBeVisible();
    await expect(
      canvas.getByText("You'll no longer get this artist's newsletter."),
    ).toBeVisible();
    const unsubscribe = canvas.getByRole('button', { name: 'Unsubscribe' });
    await userEvent.click(unsubscribe);
    await waitFor(() => expect(unsubscribe).toBeEnabled());
    await expect(canvas.queryByRole('alert')).toBeNull();
  },
};
