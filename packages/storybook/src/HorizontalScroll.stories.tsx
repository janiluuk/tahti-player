import { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { HorizontalScroll } from '@tahti-player/ui';

const meta = {
  title: 'Components/HorizontalScroll',
  component: HorizontalScroll,
  tags: ['autodocs'],
} satisfies Meta<typeof HorizontalScroll>;

export default meta;

type Story = StoryObj<typeof HorizontalScroll>;

const columns = ['Track', 'Plays', 'Listeners', 'Downloads', 'Saves', 'Shares'];

const Table = () => (
  <table className="w-[40rem] text-left text-sm">
    <thead>
      <tr>
        {columns.map((column) => (
          <th key={column} className="px-2 py-1">
            {column}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      <tr>
        {columns.map((column) => (
          <td key={column} className="px-2 py-1">
            {column === 'Track' ? 'Aurora Drift' : '42'}
          </td>
        ))}
      </tr>
    </tbody>
  </table>
);

export const Overflowing: Story = {
  render: () => (
    <div className="w-72">
      <HorizontalScroll label="Plays by track">
        <Table />
      </HorizontalScroll>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const region = await canvas.findByRole('region', {
      name: 'Plays by track',
    });
    await expect(region).toHaveAttribute('tabindex', '0');
  },
};

export const Fits: Story = {
  render: () => (
    <div className="w-[48rem]">
      <HorizontalScroll label="Plays by track">
        <Table />
      </HorizontalScroll>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText('Aurora Drift');
    await expect(canvas.queryByRole('region')).not.toBeInTheDocument();
  },
};
