import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import {
  deleteMockInternetRadioPreset,
  listMockInternetRadioPresets,
  resetMockInternetRadioPresets,
} from '@tahti-web/api/internetRadioPresetsMockStore';
import { useStationHealthStore } from '@tahti-web/stores/stationHealthStore';
import { InternetRadioPresetsPanel } from '@tahti-web/views/admin/InternetRadioPresetsPanel';
import { expect, userEvent, within } from 'storybook/test';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';
import { findDialog } from './_lib/play';

const meta: Meta<typeof InternetRadioPresetsPanel> = {
  title: 'Tahti/Admin/InternetRadioPresetsPanel',
  component: InternetRadioPresetsPanel,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Admin → Radio → Stations: Tahti Radio’s own stream, the internet radio presets offered on the Listen page, and built-in catalog stations not yet added as presets. Each station shows its stream URL and the session’s last health check, with Test (run from the admin’s browser).',
      },
    },
  },
  decorators: [
    withTahtiRouter('/admin/radio'),
    withMockAuth(),
    (Story) => {
      resetMockInternetRadioPresets();
      useStationHealthStore.getState().reset();
      return <Story />;
    },
  ],
};

const YLEX_STREAM = 'https://icecast.live.yle.fi/radio/YleX/icecast.audio';

const withoutYleXPreset: Decorator = (Story) => {
  const ylex = listMockInternetRadioPresets().find(
    (preset) => preset.name === 'YleX',
  );
  if (ylex) {
    deleteMockInternetRadioPreset(ylex.id);
  }
  return <Story />;
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Six stations, all enabled for everyone. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', {
        name: 'Internet radio — Listen page defaults (6)',
      }),
    ).toBeVisible();
    await expect(canvas.getByText('YleX')).toBeVisible();
    await expect(canvas.getAllByText('Enabled for everyone')).toHaveLength(6);
    await expect(
      canvas.getAllByRole('button', { name: 'Disable' }),
    ).toHaveLength(6);
    await expect(canvas.getByTestId('tahti-radio-station')).toBeVisible();
    await expect(canvas.getByText(YLEX_STREAM)).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Test YleX stream' }),
    ).toBeEnabled();
  },
};

/** A station whose last test failed, and one that could not be verified. */
export const HealthResults: Story = {
  decorators: [
    (Story) => {
      useStationHealthStore
        .getState()
        .markUnavailable(YLEX_STREAM, { reason: 'http', status: 404 });
      return <Story />;
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText('Unavailable · Server error (HTTP 404)'),
    ).toBeVisible();
  },
};

/** A built-in station that is not a preset can be added from the catalog. */
export const CatalogStation: Story = {
  decorators: [withoutYleXPreset],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { name: 'Built-in catalog (1)' }),
    ).toBeVisible();
    await userEvent.click(
      canvas.getByRole('button', { name: 'Add as preset' }),
    );
    const dialog = await findDialog(
      canvasElement,
      'Add internet radio station',
    );
    await expect(dialog.getByRole('textbox', { name: 'Name' })).toHaveValue(
      'YleX',
    );
    await expect(
      dialog.getByRole('textbox', { name: 'Stream URL' }),
    ).toHaveValue(YLEX_STREAM);
  },
};

/** An http:// stream is refused before saving: the HTTPS player can't load it. */
export const InsecureStreamUrl: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText('YleX');
    await userEvent.click(canvas.getByRole('button', { name: 'Add station' }));
    const dialog = await findDialog(
      canvasElement,
      'Add internet radio station',
    );
    await userEvent.type(
      dialog.getByRole('textbox', { name: 'Name' }),
      'Plain FM',
    );
    await userEvent.type(
      dialog.getByRole('textbox', { name: 'Stream URL' }),
      'http://plain.example/live.mp3',
    );
    await userEvent.click(dialog.getByRole('button', { name: 'Add station' }));
    await expect(
      await dialog.findByText('Stream URL must start with https://'),
    ).toBeVisible();
  },
};

export const AddStation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText('YleX');
    await userEvent.click(canvas.getByRole('button', { name: 'Add station' }));
    const dialog = await findDialog(
      canvasElement,
      'Add internet radio station',
    );
    await expect(dialog.getByRole('textbox', { name: 'Name' })).toHaveValue('');
    await expect(
      dialog.getByRole('textbox', { name: 'Stream URL' }),
    ).toBeVisible();
  },
};

/** Edit opens the same editor, prefilled with the station. */
export const EditStation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText('YleX');
    await userEvent.click(canvas.getAllByRole('button', { name: 'Edit' })[0]!);
    const dialog = await findDialog(canvasElement, 'Edit station');
    await expect(dialog.getByRole('textbox', { name: 'Name' })).toHaveValue(
      'YleX',
    );
    await expect(
      dialog.getByRole('button', { name: 'Save changes' }),
    ).toBeVisible();
  },
};
