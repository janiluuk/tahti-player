import type { Meta, StoryObj } from '@storybook/react-vite';
import { MaterialSetsField } from '@tahti-web/components/MaterialSetsField';
import { expect, userEvent, within } from 'storybook/test';

const meta: Meta<typeof MaterialSetsField> = {
  title: 'Tahti/Track/MaterialSetsField',
  component: MaterialSetsField,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          "Sets card for material edit — searchable list of the artist's collections; click a row to add or remove this sound right away, or create a new set inline.",
      },
    },
  },
  tags: ['autodocs'],
  args: { soundId: 'mock-sound-1' },
  render: (args) => (
    <div className="max-w-xl">
      <MaterialSetsField {...args} />
    </div>
  ),
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('Sets')).toBeVisible();
    await expect(
      await canvas.findByRole('button', { name: 'New set' }),
    ).toBeVisible();
  },
};

export const NoSearchMatch: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('button', { name: 'New set' });
    await userEvent.type(
      canvas.getByRole('textbox', { name: 'Search your sets' }),
      'zzzz-no-such-set',
    );
    await expect(
      await canvas.findByText('No sets match that search.'),
    ).toBeVisible();
  },
};

export const CreateForm: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole('button', { name: 'New set' }),
    );
    await expect(
      await canvas.findByRole('button', { name: 'Create and add' }),
    ).toBeDisabled();
    await userEvent.type(canvas.getByLabelText('Name'), 'Night drive');
    await expect(
      canvas.getByRole('button', { name: 'Create and add' }),
    ).toBeEnabled();
  },
};
