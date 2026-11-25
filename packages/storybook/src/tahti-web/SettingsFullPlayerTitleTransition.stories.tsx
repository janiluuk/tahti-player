import type { Meta, StoryObj } from '@storybook/react-vite';
import { usePlaybackPrefsStore } from '@tahti-web/stores/playbackPrefsStore';
import { FullPlayerTitleTransitionSetting } from '@tahti-web/views/settings/panels/FullPlayerTitleTransitionSetting';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { withPageSurface } from './_lib/decorators';
import { withinBody } from './_lib/play';

const meta: Meta<typeof FullPlayerTitleTransitionSetting> = {
  title: 'Tahti/Settings/FullPlayerTitleTransition',
  component: FullPlayerTitleTransitionSetting,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Settings → Appearance: how the track name changes in the full-screen player (fade, slide up, soft scale, slide sideways). Defaults to fade, remembered in this browser; reduced motion still changes the title without movement.',
      },
    },
  },
  decorators: [withPageSurface()],
  beforeEach: () => {
    usePlaybackPrefsStore.getState().setFullPlayerTitleTransition('fade');
    return () => {
      usePlaybackPrefsStore.getState().setFullPlayerTitleTransition('fade');
    };
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('button', { name: /Full-screen title change/ }),
    ).toHaveTextContent('Fade');
  },
};

export const PickSlideUp: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const select = canvas.getByRole('button', {
      name: /Full-screen title change/,
    });
    await userEvent.click(select);
    await userEvent.click(
      await withinBody(canvasElement).findByRole('option', {
        name: 'Slide up',
      }),
    );
    await waitFor(() => expect(select).toHaveTextContent('Slide up'));
    await expect(
      usePlaybackPrefsStore.getState().fullPlayerTitleTransition,
    ).toBe('slide-up');
  },
};
