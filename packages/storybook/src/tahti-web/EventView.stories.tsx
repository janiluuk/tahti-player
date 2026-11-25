import type { Meta, StoryObj } from '@storybook/react-vite';
import { setBackdropFrameVerdict } from '@tahti-web/lib/backdropMotion';
import { useEventBrowseStore } from '@tahti-web/stores/eventBrowseStore';
import { EventView } from '@tahti-web/views/EventView';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof EventView> = {
  title: 'Tahti/Events/EventView',
  component: EventView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Public event page (`/events/:eventId`, `GET /api/v1/events/:id`): the card, full description, Add to Google Calendar, the artist .ics feed and a share link. Drafts are not found.',
      },
    },
  },
  args: { eventId: 'evt-mock-guest' },
  decorators: [withTahtiRouter('/events/evt-mock-guest')],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Published: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByTestId('event-page')).toBeVisible();
    await expect(
      canvas.getByRole('link', { name: /Add to Google Calendar/ }),
    ).toBeVisible();
    await expect(canvas.getByTestId('event-banner-backdrop')).toBeTruthy();
  },
};

/** The banner backdrop as a device that drops frames (or has no GPU, or
 * asks for reduced motion) sees it: blurred once, no drift. */
export const StillBackdrop: Story = {
  beforeEach: () => {
    setBackdropFrameVerdict('slow');
    return () => setBackdropFrameVerdict('pending');
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByTestId('event-page')).toBeVisible();
    const backdrop = canvas.getByTestId('event-banner-backdrop');
    await expect(backdrop).toHaveAttribute('data-still', 'true');
    const drift = backdrop.querySelector('.tahti-event-backdrop-drift');
    await expect(drift && getComputedStyle(drift).animationName).toBe('none');
  },
};

const browseRow = [
  { id: 'evt-row-before', title: 'Warm-up session' },
  { id: 'evt-mock-guest', title: 'Guest set' },
  { id: 'evt-row-after', title: 'Closing night' },
];

/** Opened from a row of events: the header steps to the previous and next
 * event of that row (← / → and a sideways swipe do the same). The ends do
 * not wrap. */
export const BrowseRow: Story = {
  beforeEach: () => {
    useEventBrowseStore.setState({ items: browseRow, arrival: null });
    return () => useEventBrowseStore.setState({ items: null, arrival: null });
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByTestId('event-page')).toBeVisible();
    const nav = canvas.getByRole('navigation', { name: 'Browse events' });
    await expect(
      within(nav).getByRole('button', {
        name: 'Previous event: Warm-up session',
      }),
    ).toBeEnabled();
    await expect(within(nav).getByText('2 of 3')).toBeVisible();
    await userEvent.click(
      within(nav).getByRole('button', { name: 'Next event: Closing night' }),
    );
    await waitFor(() =>
      expect(useEventBrowseStore.getState().arrival).toEqual({
        eventId: 'evt-row-after',
        direction: 'next',
      }),
    );
  },
};

/** First event of its row: Previous is disabled rather than wrapping. */
export const BrowseRowStart: Story = {
  beforeEach: () => {
    useEventBrowseStore.setState({
      items: browseRow.slice(1),
      arrival: null,
    });
    return () => useEventBrowseStore.setState({ items: null, arrival: null });
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByTestId('event-page')).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'No previous event' }),
    ).toBeDisabled();
    await expect(
      canvas.getByRole('button', { name: 'Next event: Closing night' }),
    ).toBeEnabled();
  },
};

/** Calendar links, share and comments sit in a side panel beside the
 * details on wide screens and follow the details on phones. */
export const SidePanel: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByTestId('event-page')).toBeVisible();
    const panel = canvas.getByRole('complementary', {
      name: 'Event actions and comments',
    });
    await expect(
      within(panel).getByRole('link', { name: /Add to Google Calendar/ }),
    ).toBeVisible();
    await expect(await within(panel).findByTestId('event-comments')).toBe(
      within(panel).getByTestId('event-comments'),
    );
    const main = canvas.getByTestId('event-main').getBoundingClientRect();
    const side = panel.getBoundingClientRect();
    if (window.matchMedia('(min-width: 1024px)').matches) {
      await expect(side.left).toBeGreaterThanOrEqual(main.right);
      await expect(side.top).toBeLessThan(main.bottom);
    } else {
      await expect(side.top).toBeGreaterThanOrEqual(main.bottom);
    }
  },
};

export const NotFound: Story = {
  args: { eventId: 'evt-mock-7' },
  decorators: [withTahtiRouter('/events/evt-mock-7')],
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByText('Event not found'),
    ).toBeVisible();
  },
};
