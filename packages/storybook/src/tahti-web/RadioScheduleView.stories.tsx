import type { Meta, StoryObj } from '@storybook/react-vite';
import { mockBookings, setMockBookings } from '@tahti-web/api/shows/mock';
import { RadioScheduleView } from '@tahti-web/views/RadioScheduleView';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import {
  MOCK_USERS,
  withMockAuth,
  withPageSurface,
  withTahtiRouter,
} from './_lib/decorators';
import { mockData } from './_lib/mock-data';
import { expectNoDialog, findDialog, selectTab } from './_lib/play';

const meta: Meta<typeof RadioScheduleView> = {
  title: 'Tahti/Channel/RadioScheduleView',
  component: RadioScheduleView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The Tahti Radio booking calendar at `/schedule`: a week of hourly cells, a green room banner for shows about to start, and for artists with a channel their next two weeks, a My channel filter, and booking, editing and cancelling 1-2 hour slots.',
      },
    },
  },
  decorators: [withPageSurface(), withTahtiRouter('/schedule')],
  // The mock booking API edits module state; put it back after each story.
  beforeEach: () => {
    const saved = mockBookings;
    return () => setMockBookings(saved);
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SignedOut: Story = {
  decorators: [withMockAuth(null)],
  parameters: {
    // Signed out, no slot is the viewer's own.
    mockData: mockData({
      showBookings: (base) => base.map((b) => ({ ...b, isMine: false })),
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('link', {
        name: "Open Midnight Cartography's green room",
      }),
    ).toHaveAttribute('href', '/u/midnight-cartography/green-room');
    await expect(canvas.getByText(/starting soon|live now/)).toBeVisible();
    await expect(canvas.getAllByRole('tab')).toHaveLength(1);
    await expect(canvas.queryByText('Your next two weeks')).toBeNull();
    const booked = await canvas.findByRole('button', {
      name: 'Kaiku Cypher Sessions by Kaiku Collective',
    });
    await userEvent.click(booked);
    await expect(within(document.body).queryByRole('dialog')).toBeNull();
    await expect(canvas.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      '/login',
    );
  },
};

export const ListenerWithoutChannel: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  parameters: {
    mockData: mockData({
      showBookings: (base) => base.map((b) => ({ ...b, isMine: false })),
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('button', { name: 'Set up a channel' }),
    ).toBeVisible();
    await expect(canvas.queryByRole('tab', { name: /My channel/ })).toBeNull();
  },
};

export const ArtistBooksASlot: Story = {
  decorators: [withMockAuth(MOCK_USERS.artist)],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('own bookings are listed and the filter works', async () => {
      const aside = within(
        (await canvas.findByText('Your next two weeks')).parentElement!,
      );
      await expect(
        await aside.findByRole('button', { name: /Friday Frequency/ }),
      ).toBeVisible();
      await selectTab(canvas, /My channel/);
      await waitFor(() =>
        expect(
          canvas.queryByRole('button', {
            name: 'Kaiku Cypher Sessions by Kaiku Collective',
          }),
        ).toBeNull(),
      );
      await selectTab(canvas, /Tahti Radio/);
      await expect(
        await canvas.findByRole('button', {
          name: 'Kaiku Cypher Sessions by Kaiku Collective',
        }),
      ).toBeVisible();
    });

    await step('pick two hours next week and book a talk', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Next week' }));
      await expect(
        await canvas.findByRole('button', { name: 'This week' }),
      ).toBeVisible();
      const [cell] = await canvas.findAllByRole('button', {
        name: /at 10:00 — available$/,
      });
      await waitFor(() => expect(cell).toBeEnabled());
      await userEvent.click(cell!);
      await userEvent.click(canvas.getByRole('button', { name: '+1 hour' }));
      await expect(canvas.getByText('(2h)')).toBeVisible();
      await expect(
        canvas.queryByRole('button', { name: '+1 hour' }),
      ).toBeNull();
      await userEvent.click(canvas.getByRole('radio', { name: 'Talk' }));
      await userEvent.type(
        canvas.getByPlaceholderText('Note (optional) — topic or guests'),
        'Studio Q&A',
      );
      await userEvent.click(
        canvas.getByRole('button', { name: 'Confirm booking' }),
      );
      await expect(await canvas.findByText('Slot booked.')).toBeVisible();
      await expect(
        canvas.getAllByRole('button', {
          name: 'Studio Q&A by Demo Artist — click to view',
        }),
      ).toHaveLength(2);
    });
  },
};

export const ArtistEditsAndCancels: Story = {
  decorators: [withMockAuth(MOCK_USERS.artist)],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('edit the note', async () => {
      const [own] = await canvas.findAllByRole('button', {
        name: 'Friday Frequency by Demo Artist — click to view',
      });
      await userEvent.click(own!);
      const dialog = await findDialog(canvasElement, 'Friday Frequency');
      const note = dialog.getByPlaceholderText("Note — what you're playing");
      await userEvent.clear(note);
      await userEvent.type(note, 'Friday Frequency - b2b special');
      await userEvent.click(
        dialog.getByRole('button', { name: 'Save changes' }),
      );
      await expect(await canvas.findByText('Booking updated.')).toBeVisible();
      await findDialog(canvasElement, 'Friday Frequency - b2b special');
    });

    await step('cancel it', async () => {
      const dialog = await findDialog(
        canvasElement,
        'Friday Frequency - b2b special',
      );
      await userEvent.click(
        dialog.getByRole('button', { name: 'Cancel booking' }),
      );
      const confirm = await findDialog(canvasElement, 'Cancel this booking?');
      await expect(confirm.getByText(/This can't be undone/)).toBeVisible();
      await userEvent.click(
        confirm.getByRole('button', { name: 'Cancel booking' }),
      );
      await expectNoDialog(canvasElement);
      await expect(await canvas.findByText('Booking cancelled.')).toBeVisible();
      await expect(
        canvas.queryByRole('button', { name: /b2b special by Demo Artist/ }),
      ).toBeNull();
    });
  },
};
