import type { Meta, StoryObj } from '@storybook/react-vite';
import { VenueRegisterView } from '@tahti-web/views/VenueRegisterView';
import { expect, userEvent, within } from 'storybook/test';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof VenueRegisterView> = {
  title: 'Tahti/Discover/VenueRegisterView',
  component: VenueRegisterView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Register a venue (`/venues/register`): slug, name, address, city, country, capacity, description, venue image, cover art and website. Submitting sends it for board verification and links to My venues. Signed out it only shows a log-in link.',
      },
    },
  },
  decorators: [withTahtiRouter('/venues/register')],
  render: () => (
    <div className="p-6">
      <VenueRegisterView />
    </div>
  ),
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Form: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('heading', { level: 1, name: 'Register a venue' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('textbox', { name: 'URL slug' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('textbox', { name: 'Country code' }),
    ).toHaveValue('FI');
    await expect(
      canvas.getByRole('button', { name: 'Submit for review' }),
    ).toBeDisabled();
    await expect(
      canvas.getByRole('link', { name: 'All venues' }),
    ).toHaveAttribute('href', '/discover?tab=venues');
  },
};

export const Submit: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      canvas.getByRole('textbox', { name: 'URL slug' }),
      'kulttuuritalo',
    );
    await userEvent.type(
      canvas.getByRole('textbox', { name: 'Venue name' }),
      'Kulttuuritalo',
    );
    await userEvent.type(
      canvas.getByRole('textbox', { name: 'Street address' }),
      'Sturenkatu 4',
    );
    await userEvent.type(
      canvas.getByRole('textbox', { name: 'City' }),
      'Helsinki',
    );
    await userEvent.click(
      canvas.getByRole('button', { name: 'Submit for review' }),
    );
    await expect(
      await canvas.findByRole('heading', { level: 1, name: 'Submitted' }),
    ).toBeVisible();
    await expect(canvas.getByText('kulttuuritalo')).toBeVisible();
    await expect(
      canvas.getByRole('link', { name: 'Go to My venues' }),
    ).toHaveAttribute('href', '/venues/mine');
  },
};

export const SignedOut: Story = {
  decorators: [withMockAuth(null)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('heading', { level: 1, name: 'Register a venue' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('link', { name: 'Log in →' }),
    ).toHaveAttribute('href', '/login');
    await expect(
      canvas.queryByRole('textbox', { name: 'URL slug' }),
    ).not.toBeInTheDocument();
  },
};
