import type { Meta, StoryObj } from '@storybook/react-vite';
import { useLanguageStore } from '@tahti-web/stores/languageStore';
import { LanguagePanel } from '@tahti-web/views/settings/panels/LanguagePanel';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { withPageSurface } from './_lib/decorators';
import { withinBody } from './_lib/play';

const meta: Meta<typeof LanguagePanel> = {
  title: 'Tahti/Settings/LanguagePanel',
  component: LanguagePanel,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Settings → Language: the browser language (default), English or Suomi for menus, buttons and dates. Applies at once, sets `<html lang>` and is remembered in this browser. Missing states: loading/error (the Finnish catalog is a lazy chunk; a failed fetch keeps English).',
      },
    },
  },
  decorators: [withPageSurface()],
  beforeEach: async () => {
    await useLanguageStore.getState().setChoice('en_US');
    return async () => {
      await useLanguageStore.getState().setChoice('en_US');
    };
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('button', { name: /Language/ }),
    ).toHaveTextContent('English');
  },
};

export const SwitchToFinnish: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /Language/ }));
    await userEvent.click(
      await withinBody(canvasElement).findByRole('option', { name: 'Suomi' }),
    );
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: /Kieli/ })).toHaveTextContent(
        'Suomi',
      ),
    );
    await expect(document.documentElement.lang).toBe('fi-FI');
  },
};
