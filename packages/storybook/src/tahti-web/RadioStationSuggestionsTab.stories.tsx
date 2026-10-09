import type { Meta, StoryObj } from '@storybook/react-vite';
import { RadioStationSuggestionsTab } from '@tahti-web/views/admin/orphanPages/tabs/RadioStationSuggestionsTab';
import { expect, userEvent, within } from 'storybook/test';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof RadioStationSuggestionsTab> = {
  title: 'Tahti/Admin/RadioStationSuggestionsTab',
  component: RadioStationSuggestionsTab,
  parameters: { layout: 'fullscreen' },
  decorators: [
    withTahtiRouter('/admin/radio-station-suggestions'),
    withMockAuth(),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="p-6">
      <RadioStationSuggestionsTab />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { name: 'Basso FM' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('heading', { name: 'Lumo Radio' }),
    ).toBeVisible();
    await expect(
      canvas.getAllByRole('button', { name: 'Approve' }),
    ).toHaveLength(2);
    await expect(
      canvas.getAllByRole('button', { name: 'Reject' }),
    ).toHaveLength(2);
    const note = canvas.getAllByLabelText(/rejection note/i)[0]!;
    await userEvent.type(note, 'Stream is offline');
    await expect(note).toHaveValue('Stream is offline');
  },
};
