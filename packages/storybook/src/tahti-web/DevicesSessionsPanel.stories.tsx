import type { Meta, StoryObj } from '@storybook/react-vite';
import { DevicesSessionsPanel } from '@tahti-web/components/DevicesSessionsPanel';
import { expect, within } from 'storybook/test';

const meta: Meta<typeof DevicesSessionsPanel> = {
  title: 'Tahti/Settings/DevicesSessionsPanel',
  component: DevicesSessionsPanel,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('button', {
        name: /sign out everywhere|kirjaudu ulos kaikkialta/i,
      }),
    ).toBeInTheDocument();
  },
};
