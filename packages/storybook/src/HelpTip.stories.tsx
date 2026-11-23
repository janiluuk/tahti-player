import { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import { HelpTip, Toggle } from '@tahti-player/ui';

const meta = {
  title: 'Components/HelpTip',
  component: HelpTip,
  tags: ['autodocs'],
  args: {
    label: 'About dynamic theme',
    content: 'Colours follow the artwork of what is playing.',
  },
} satisfies Meta<typeof HelpTip>;

export default meta;

type Story = StoryObj<typeof HelpTip>;

/** Next to a setting's one-line label; the explanation shows on hover or
 * keyboard focus. */
export const NextToASetting: Story = {
  render: (args) => (
    <div className="flex items-center gap-2 p-8">
      <Toggle checked={false} onChange={() => {}} label="Dynamic theme" />
      <span className="text-sm font-medium">Dynamic theme</span>
      <HelpTip {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: 'About dynamic theme' });
    await expect(button).toHaveAccessibleDescription(
      'Colours follow the artwork of what is playing.',
    );
    await userEvent.tab();
    await userEvent.tab();
    await expect(button).toHaveFocus();
  },
};
