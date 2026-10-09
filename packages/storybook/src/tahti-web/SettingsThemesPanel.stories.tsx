import type { Meta, StoryObj } from '@storybook/react-vite';
import { ThemesPanel } from '@tahti-web/views/settings/panels/ThemesPanel';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import {
  MOCK_USERS,
  withMockAuth,
  withPageSurface,
  withTahtiRouter,
} from './_lib/decorators';
import { expectVisible, selectTab } from './_lib/play';

const meta: Meta<typeof ThemesPanel> = {
  title: 'Tahti/Settings/ThemesPanel',
  component: ThemesPanel,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Settings → Themes: light / dark switch and the Dynamic theme toggle, then Browse (built-in and imported themes, with Apply and Configure), Editor and Import JSON. The plays only read and type, so they never change the theme the rest of Storybook runs in.',
      },
    },
  },
  decorators: [
    withPageSurface(),
    withTahtiRouter('/settings/themes'),
    withMockAuth(MOCK_USERS.listener),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Browse: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectVisible(canvas.getByRole('switch', { name: 'Dynamic theme' }));
    await expect(canvas.getByRole('tab', { name: 'Browse' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await waitFor(() =>
      expect(
        canvas.getAllByText('Built-in Nuclear theme').length,
      ).toBeGreaterThan(1),
    );
    await expectVisible(canvas.getByRole('tab', { name: 'Editor' }));
  },
};

// Import stays disabled until there is JSON, and says when it isn't JSON.
export const ImportJson: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await selectTab(canvas, 'Import JSON');
    await expectVisible(
      canvas.getByRole('heading', { name: 'Import a theme' }),
    );
    const importButton = canvas.getByRole('button', {
      name: 'Import & apply',
    });
    await expect(importButton).toBeDisabled();
    await userEvent.type(canvas.getByRole('textbox'), 'not json');
    await userEvent.click(importButton);
    await expectVisible(await canvas.findByText('Not valid JSON.'));
  },
};
