import type { Meta, StoryObj } from '@storybook/react-vite';
import { useLanguageStore } from '@tahti-web/stores/languageStore';
import { usePlaybackPrefsStore } from '@tahti-web/stores/playbackPrefsStore';
import { GeneralPanel } from '@tahti-web/views/settings/panels/GeneralPanel';
import { expect, userEvent, within } from 'storybook/test';

import { withPageSurface } from './_lib/decorators';

const meta: Meta<typeof GeneralPanel> = {
  title: 'Tahti/Settings/GeneralPanel',
  component: GeneralPanel,
  parameters: { layout: 'fullscreen' },
  decorators: [withPageSurface()],
  beforeEach: async () => {
    usePlaybackPrefsStore.setState({ fullPlayerTitleTransition: 'fade' });
    await useLanguageStore.getState().setChoice('en_US');
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('button', { name: /Language/ }),
    ).toHaveTextContent('🇬🇧 English');
    await userEvent.click(
      canvas.getByRole('button', { name: /Full-screen title change/ }),
    );
    await userEvent.click(
      within(document.body).getByRole('option', { name: 'Slide sideways' }),
    );
    await expect(
      canvas.getByRole('button', { name: /Full-screen title change/ }),
    ).toHaveTextContent('Slide sideways');
  },
};
