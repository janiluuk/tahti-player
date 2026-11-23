import type { Meta, StoryObj } from '@storybook/react-vite';
import { StudioScheduleView } from '@tahti-web/views/studio/StudioScheduleView';
import { expect, userEvent, within } from 'storybook/test';

import { withToaster } from './_fixtures/track-release';
import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';
import { findToast, withinBody } from './_lib/play';

const meta: Meta<typeof StudioScheduleView> = {
  title: 'Tahti/Studio/StudioScheduleView',
  component: StudioScheduleView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Studio → Schedule: upcoming slots and analytics on the first tab, then the Channel programme tab (`?tab=programme`): announcements, offline fallback and auto-enroll switches, the 24/7 rotation source, the radio playlist and announcement clips. It is the one place to edit the programme; the Channel Designer, Studio → Channel → 24/7 and old Settings → Broadcast links point here. Renders against the mock API layer.',
      },
    },
  },
  decorators: [withTahtiRouter('/studio/schedule'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ChannelProgramme: Story = {
  decorators: [withToaster(), withMockAuth(MOCK_USERS.artist)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole('tab', { name: 'Channel programme' }),
    );
    await expect(
      await canvas.findByRole('heading', { name: 'Channel programme' }),
    ).toBeVisible();
    await expect(
      await canvas.findByRole('switch', {
        name: 'Fallback / autoplay when offline',
      }),
    ).toBeVisible();
    await expect(
      await canvas.findByRole('heading', { name: 'Rotation source' }),
    ).toBeVisible();
    await userEvent.click(
      await canvas.findByRole('button', { name: /Play from/ }),
    );
    await userEvent.click(
      await withinBody(canvasElement).findByRole('option', {
        name: /Late night/,
      }),
    );
    await findToast(canvasElement, 'Rotation source saved.');
  },
};
