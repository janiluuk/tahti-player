import type { Meta, StoryObj } from '@storybook/react-vite';
import { MaterialGroupsField } from '@tahti-web/components/MaterialGroupsField';
import { expect, userEvent, within } from 'storybook/test';

const meta: Meta<typeof MaterialGroupsField> = {
  title: 'Tahti/Track/MaterialGroupsField',
  component: MaterialGroupsField,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Groups card for material edit — the artist\'s groups with a toggle to put this sound on each group\'s collective playlist. Groups that approve new sounds first show "Pending approval" after a member submits. Fixtures: `groups-mock.ts`.',
      },
    },
  },
  tags: ['autodocs'],
  args: { soundId: 'mock-sound-1' },
  render: (args) => (
    <div className="max-w-xl">
      <MaterialGroupsField {...args} />
    </div>
  ),
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('button', { name: /Trance Mixes and DJ Sets/ }),
    ).toHaveAttribute('aria-pressed', 'false');
    await expect(
      canvas.getByRole('button', { name: /Finland DJ's/ }),
    ).toBeVisible();
  },
};

export const AddToGroup: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const row = await canvas.findByRole('button', {
      name: /Trance Mixes and DJ Sets/,
    });
    await userEvent.click(row);
    await expect(
      await canvas.findByRole('button', { name: /Trance Mixes and DJ Sets/ }),
    ).toHaveAttribute('aria-pressed', 'true');
  },
};

export const PendingApproval: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole('button', { name: /Finland DJ's/ }),
    );
    await expect(await canvas.findByText('Pending approval')).toBeVisible();
  },
};

export const NoSearchMatch: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('button', { name: 'New group' });
    await userEvent.type(
      canvas.getByRole('textbox', { name: 'Search your groups' }),
      'zzzz-no-such-group',
    );
    await expect(
      await canvas.findByText('No groups match that search.'),
    ).toBeVisible();
  },
};

export const CreateForm: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole('button', { name: 'New group' }),
    );
    await expect(
      await canvas.findByRole('button', { name: 'Create group' }),
    ).toBeDisabled();
    await userEvent.type(canvas.getByLabelText('Name'), 'Night drivers');
    await expect(
      canvas.getByRole('button', { name: 'Create group' }),
    ).toBeEnabled();
  },
};
