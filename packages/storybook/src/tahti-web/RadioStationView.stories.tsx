import type { Meta, StoryObj } from '@storybook/react-vite';
import { RadioStationView } from '@tahti-web/views/RadioStationView';
import { useRouterState } from '@tanstack/react-router';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof RadioStationView> = {
  title: 'Tahti/Listen/RadioStationView',
  component: RadioStationView,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/radio/station/radio-helsinki')],
  args: { stationId: 'radio-helsinki' },
  render: (args) => (
    <>
      <RadioStationView {...args} />
      <LocationProbe />
    </>
  ),
};

/** Where the station dial navigated to (the story router has no real
 * station route, so the page itself stays put). */
function LocationProbe() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <p className="sr-only" data-testid="story-location">
      {pathname}
    </p>
  );
}

export default meta;
type Story = StoryObj<typeof meta>;

// One of the curated Finnish stations: stream details, what's on air (ICY
// title when the stream sends one), play, add to Listen and the station's
// own links.
export const Station: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cards = within(canvas.getByTestId('other-stations')).getAllByTestId(
      'card',
    );
    const card = cards.find((item) =>
      within(item).queryByRole('link', { name: 'Radio Rock' }),
    );
    await expect(card).toBeDefined();
    card!.scrollIntoView({
      block: 'nearest',
      inline: 'center',
      behavior: 'instant',
    });
    await userEvent.click(within(card!).getByTestId('media-artwork-play'));
    await expect(card).toHaveAttribute('data-playing', 'true');
    await userEvent.click(
      await within(card!).findByRole('button', {
        name: 'Pause Radio Rock',
        exact: true,
      }),
    );
    await expect(card).not.toHaveAttribute('data-playing');
  },
};

export const HlsStation: Story = { args: { stationId: 'radio-rock' } };

export const UnknownStation: Story = { args: { stationId: 'nope' } };

/** Swipe left/right on the station header (touch), press the arrow keys
 * while it has focus, or use its previous/next buttons to change station. */
export const ChangeStation: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const location = canvas.getByTestId('story-location');
    const dial = canvas.getByTestId('radio-station-dial');

    await step('arrow keys on the focused stage', async () => {
      dial.focus();
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(() =>
        expect(location).toHaveTextContent('/radio/station/radio-rock'),
      );
      await userEvent.keyboard('{ArrowLeft}');
      await waitFor(() =>
        expect(location).toHaveTextContent('/radio/station/ylex'),
      );
    });

    await step(
      'a touch swipe to the left goes to the next station',
      async () => {
        const box = dial.getBoundingClientRect();
        const y = box.top + 20;
        const touch = { pointerId: 7, pointerType: 'touch', isPrimary: true };
        dial.dispatchEvent(
          new PointerEvent('pointerdown', {
            ...touch,
            bubbles: true,
            clientX: box.left + 200,
            clientY: y,
          }),
        );
        dial.dispatchEvent(
          new PointerEvent('pointerup', {
            ...touch,
            bubbles: true,
            clientX: box.left + 80,
            clientY: y + 10,
          }),
        );
        await waitFor(() =>
          expect(location).toHaveTextContent('/radio/station/radio-rock'),
        );
      },
    );

    await step('previous / next buttons', async () => {
      await userEvent.click(
        canvas.getByRole('button', { name: 'Previous station: YleX' }),
      );
      await waitFor(() =>
        expect(location).toHaveTextContent('/radio/station/ylex'),
      );
    });
  },
};
