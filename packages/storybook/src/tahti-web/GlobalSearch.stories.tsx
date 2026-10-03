import type { Meta, StoryObj } from '@storybook/react-vite';
import { GlobalSearch } from '@tahti-web/components/GlobalSearch';
import { expect, userEvent, within } from 'storybook/test';

import { withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof GlobalSearch> = {
  title: 'Tahti/Widgets/GlobalSearch',
  component: GlobalSearch,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/')],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

// GlobalSearch has no controllable props — query/results are entirely
// internal state driven by typing into the input, debounced against the
// mocked search API. A `play` function drives real user input to reach
// the "with results" state, searching for "Northern" which matches the
// mock artist "Northern Lights" in the fixture directory.
export const WithResults: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox');
    await userEvent.click(input);
    await userEvent.type(input, 'Northern', { delay: 30 });
    const listbox = await canvas.findByRole('listbox');
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    await expect(
      await within(listbox).findByRole('option', { name: /Northern Lights/ }),
    ).toBeVisible();
  },
};
