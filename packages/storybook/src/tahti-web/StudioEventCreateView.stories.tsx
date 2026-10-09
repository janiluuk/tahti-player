import type { Meta, StoryObj } from '@storybook/react-vite';
import { StudioEventCreateView } from '@tahti-web/views/studio/StudioEventCreateView';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { eventsAroundToday } from './_fixtures/studio';
import { withToaster } from './_fixtures/track-release';
import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';
import { mockData } from './_lib/mock-data';
import { expectVisible, findToast, withinBody } from './_lib/play';

const meta: Meta<typeof StudioEventCreateView> = {
  title: 'Tahti/Studio/StudioEventCreateView',
  component: StudioEventCreateView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Studio → Events → Add event (`/studio/events/new`) and Edit event (`/studio/events/:id/edit`): title, place, a venue from the directory that fills place and location, location, ticket link, description and start time. The submit button stays disabled until title, place, location and start are set.',
      },
    },
    mockData: mockData({ myEvents: eventsAroundToday }),
  },
  decorators: [withToaster(), withMockAuth(MOCK_USERS.artist)],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const AddEvent: Story = {
  decorators: [withTahtiRouter('/studio/events/new')],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectVisible(canvas.getByRole('heading', { name: 'Add event' }));
    const submit = canvas.getByRole('button', { name: 'Add event' });
    await expect(submit).toBeDisabled();
    await expect(
      canvas.getByRole('link', { name: 'Register a new venue' }),
    ).toHaveAttribute('href', '/venues/register');

    await userEvent.type(
      canvas.getByRole('textbox', { name: 'Title' }),
      'Sauna rave',
    );
    await userEvent.click(
      canvas.getByRole('button', { name: 'Venue from directory' }),
    );
    await userEvent.click(
      await withinBody(canvasElement).findByRole('option', {
        name: 'Kuudes Linja · Helsinki',
      }),
    );
    await waitFor(() =>
      expect(canvas.getByRole('textbox', { name: 'Place' })).toHaveValue(
        'Kuudes Linja',
      ),
    );
    await expect(canvas.getByRole('textbox', { name: 'Location' })).toHaveValue(
      'Helsinki, FI',
    );
    await expect(submit).toBeDisabled();
    await userEvent.type(canvas.getByLabelText('Start'), '2030-06-21T20:00');
    await expect(submit).toBeEnabled();
  },
};

export const EditEvent: Story = {
  args: { eventId: 'evt-mock-2' },
  decorators: [withTahtiRouter('/studio/events/evt-mock-2/edit')],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectVisible(canvas.getByRole('heading', { name: 'Edit event' }));
    await expect(
      await canvas.findByRole('textbox', { name: 'Title' }),
    ).toHaveValue('Late-night broadcast + open studio');
    await expect(canvas.getByRole('textbox', { name: 'Place' })).toHaveValue(
      'Kuudes Linja',
    );
    await expect(
      canvas.getByRole('textbox', { name: 'Tickets / event link (optional)' }),
    ).toHaveValue('https://kuudeslinja.fi/events/midnight-cartography');
    await expect(canvas.getByLabelText('Start')).not.toHaveValue('');
    await expect(
      canvas.getByRole('button', { name: 'Save changes' }),
    ).toBeEnabled();
  },
};

export const EditMissingEvent: Story = {
  args: { eventId: 'evt-gone' },
  decorators: [withTahtiRouter('/studio/events/evt-gone/edit')],
  play: async ({ canvasElement }) => {
    await findToast(canvasElement, 'That event could not be found.');
  },
};
