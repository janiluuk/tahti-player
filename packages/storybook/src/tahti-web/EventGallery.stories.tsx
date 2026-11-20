import type { Meta, StoryObj } from '@storybook/react-vite';
import { mockEventGallery } from '@tahti-web/api/events';
import { EventGallery } from '@tahti-web/components/events/EventGallery';
import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test';

const meta: Meta<typeof EventGallery> = {
  title: 'Tahti/Events/EventGallery',
  component: EventGallery,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Event page photo gallery: a thumbnail grid with truncated captions. A thumbnail opens the full-screen ImageLightbox slideshow (arrows, PageUp/PageDown, Home/End, mouse wheel / trackpad scroll, swipe; Escape closes). Renders nothing when the event has no images.',
      },
    },
  },
  args: {
    images: mockEventGallery,
    title: 'Album release show',
    seed: 'evt-mock-2',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Grid: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('heading', { name: 'Photo gallery' }),
    ).toBeVisible();
    await expect(
      canvas.getByText('Modular rig during the opening set'),
    ).toBeVisible();
  },
};

export const Slideshow: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    await userEvent.click(
      canvas.getByRole('button', { name: /^Open image 1 of 5/ }),
    );
    const dialog = await body.findByRole('dialog', {
      name: 'Photos from Album release show',
    });
    const caption = () => dialog.querySelector('figcaption')?.textContent ?? '';
    await expect(caption()).toContain(
      'Doors open - the queue reached the corner',
    );
    await expect(caption()).toContain('1 / 5');

    fireEvent.wheel(body.getByTestId('image-lightbox'), { deltaY: 120 });
    await waitFor(() => expect(caption()).toContain('2 / 5'));
    await expect(
      within(dialog).getByText('Modular rig during the opening set'),
    ).toBeVisible();

    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(caption()).toContain('3 / 5'));
    await expect(caption()).toContain(
      'Northern Signals joined for the closing track',
    );

    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(body.queryByTestId('image-lightbox')).not.toBeInTheDocument(),
    );
  },
};

export const Empty: Story = {
  args: { images: [] },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).queryByTestId('event-gallery'),
    ).not.toBeInTheDocument();
  },
};
