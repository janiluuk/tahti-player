import type { Meta, StoryObj } from '@storybook/react-vite';
import { EventPostView } from '@tahti-web/views/EventPostView';
import { expect, within } from 'storybook/test';

import { withToaster } from './_fixtures/track-release';
import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';
import { expectVisible } from './_lib/play';

const meta: Meta<typeof EventPostView> = {
  title: 'Tahti/Events/EventPostView',
  component: EventPostView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Post event (`/events/new`) and edit one of yours (`/events/$eventId/edit`): the shared `EventForm` (also used by Studio → Add event) for any signed-in user. Drafts, Fans only and announcements only appear for Studio accounts. Signed out it shows a sign-in gate instead of the form.',
      },
    },
  },
  decorators: [withToaster(), withTahtiRouter('/events/new')],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SignedOut: Story = {
  decorators: [withMockAuth(null)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectVisible(await canvas.findByText('Sign in to post an event'));
    await expect(
      canvas.getByText(
        'Anyone with a Tahti account can post an event to the calendar.',
      ),
    ).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Sign in' })).toBeVisible();
    await expect(
      canvas.queryByRole('textbox', { name: 'Title' }),
    ).not.toBeInTheDocument();
  },
};

export const SignedIn: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectVisible(
      await canvas.findByRole('heading', { name: 'Post an event' }),
    );
    await expect(
      canvas.getByText(
        'Gigs, club nights, listening sessions: anything people can come to.',
      ),
    ).toBeVisible();
    await expect(
      await canvas.findByRole('textbox', { name: 'Title' }),
    ).toBeVisible();
    await expect(canvas.getByRole('textbox', { name: 'Place' })).toBeVisible();
    await expect(canvas.getByRole('link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      '/discover?tab=events',
    );
  },
};
