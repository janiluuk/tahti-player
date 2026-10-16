import type { Meta, StoryObj } from '@storybook/react-vite';
import { StudioGoLiveView } from '@tahti-web/views/studio/StudioGoLiveView';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { withToaster } from './_fixtures/track-release';
import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof StudioGoLiveView> = {
  title: 'Tahti/Studio/StudioGoLiveView',
  component: StudioGoLiveView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Broadcast setup and live-control surface. Lives on Studio → Go Live.',
      },
    },
  },
  decorators: [
    withToaster(),
    withTahtiRouter('/studio/go-live'),
    withMockAuth(),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ShowTitleReadyChecklist: Story = {
  name: 'Show title ready after save',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const checklist = await canvas.findByRole('list', {
      name: 'Prep checklist',
    });
    await expect(checklist.textContent).toMatch(
      /○ Show title ready|✓ Show title ready/,
    );

    const title = await canvas.findByLabelText('Show name');
    await userEvent.clear(title);
    await userEvent.type(title, 'Late Night Ambient');
    await userEvent.click(
      canvas.getByRole('button', { name: 'Save show info' }),
    );

    await waitFor(() =>
      expect(checklist.textContent).toContain('✓ Show title ready'),
    );
  },
};
