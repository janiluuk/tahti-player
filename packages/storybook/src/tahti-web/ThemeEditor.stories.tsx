import type { Meta, StoryObj } from '@storybook/react-vite';
import { ThemeEditor } from '@tahti-web/components/ThemeEditor';
import { expect, userEvent, waitFor, within } from 'storybook/test';

const meta: Meta<typeof ThemeEditor> = {
  title: 'Tahti/Settings/ThemeEditor',
  component: ThemeEditor,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Settings → Themes → Editor. Compact grouped tokens; click a swatch to expand Storybook Slider HSL controls. Appearance (light/dark/dynamic) lives on the Themes main page via ThemeController + Toggle — not inside this form.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const EmptyNameValidation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const name = await canvas.findByLabelText('Name');
    await userEvent.clear(name);
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(canvas.getByText('Theme name is required.')).toBeVisible(),
    );
  },
};

export const DiscardUnsavedChanges: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const name = await canvas.findByLabelText('Name');
    const initial = (name as HTMLInputElement).value;
    await userEvent.clear(name);
    await userEvent.type(name, 'Draft rename');
    await expect(canvas.getByRole('button', { name: 'Discard' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Discard' }));
    await expect(name).toHaveValue(initial);
    await expect(canvas.queryByRole('button', { name: 'Discard' })).toBeNull();
  },
};
