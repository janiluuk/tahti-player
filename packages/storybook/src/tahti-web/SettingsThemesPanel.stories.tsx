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
          'Settings → Themes: light / dark switch and the Dynamic theme toggle, then Browse (built-in and imported themes, with Apply and Configure) and Editor. Import JSON lives inside the editor. The plays only read and type, so they never change the theme the rest of Storybook runs in.',
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
      expect(canvas.getAllByText('Built-in theme').length).toBeGreaterThan(1),
    );
    await expectVisible(canvas.getByRole('tab', { name: 'Editor' }));
  },
};

// Exactly one card is the applied theme: framed, badged "Active", aria-current
// on the row and a pressed Apply button; the current name is pinned above the list.
export const SelectedTheme: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const current = await canvas.findAllByRole('group', { current: true });
    await expect(current).toHaveLength(1);
    const row = current[0]!;
    const name = row.getAttribute('aria-label') ?? '';
    await expect(name).not.toBe('');
    await expectVisible(within(row).getByText('Active'));
    await expect(
      within(row).getByRole('button', { name: `Apply ${name}` }),
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByRole('status')).toHaveTextContent(
      `Current theme: ${name}`,
    );
  },
};

// Import stays disabled until there is JSON, and says when it isn't JSON.
export const ImportJson: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await selectTab(canvas, 'Editor');
    await expectVisible(
      canvas.getByRole('heading', { name: 'Import a theme' }),
    );
    const importButton = canvas.getByRole('button', {
      name: 'Import & apply',
    });
    await expect(importButton).toBeDisabled();
    await userEvent.type(
      canvas.getByRole('textbox', { name: 'Theme JSON' }),
      'not json',
    );
    await userEvent.click(importButton);
    await expectVisible(await canvas.findByText('Not valid JSON.'));
  },
};
