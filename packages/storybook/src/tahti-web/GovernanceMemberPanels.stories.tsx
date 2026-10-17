import type { Meta, StoryObj } from '@storybook/react-vite';
import { CurrentBoardPanel } from '@tahti-web/components/governance/CurrentBoardPanel';
import { ElectionsPanel } from '@tahti-web/components/governance/ElectionsPanel';
import { expect, within } from 'storybook/test';

import { withTahtiRouter } from './_lib/decorators';

const meta: Meta = {
  title: 'Tahti/Governance/Member panels',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Member-only governance panels on `/governance`, each reading its own members-only API with mock data in Storybook.',
      },
    },
  },
  decorators: [withTahtiRouter('/governance')],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const CurrentBoard: Story = {
  render: () => <CurrentBoardPanel />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { name: 'Board' }),
    ).toBeVisible();
    await expect(await canvas.findByText('Mart Saar')).toBeVisible();
    await expect(canvas.getByText(/^Chair · since/)).toBeVisible();
  },
};

export const Elections: Story = {
  render: () => <ElectionsPanel />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText('Board members for 2027'),
    ).toBeVisible();
    await expect(canvas.getByText(/Nominations open until/)).toBeVisible();
    await expect(canvas.getByText('Elected')).toBeVisible();
  },
};
