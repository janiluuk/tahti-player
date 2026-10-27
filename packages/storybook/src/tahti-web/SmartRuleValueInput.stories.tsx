import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { SmartRuleValueInput } from '@tahti-web/components/SmartRuleValueInput';
import type { KeyNotation } from '@tahti-web/lib/musicalKey';
import { useDjPrefsStore } from '@tahti-web/stores/djPrefsStore';
import { expect, fn, userEvent, within } from 'storybook/test';

function withNotation(keyNotation: KeyNotation): Decorator {
  return (Story) => {
    useDjPrefsStore.setState({ keyNotation });
    return (
      <div className="h-[28rem] w-72 p-4">
        <Story />
      </div>
    );
  };
}

const meta: Meta<typeof SmartRuleValueInput> = {
  title: 'Tahti/Desktop/SmartRuleValueInput',
  component: SmartRuleValueInput,
  args: {
    rule: { field: 'key', op: 'is', value: 'Am' },
    which: 'value',
    label: 'Key',
    onChange: fn(),
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const KeyMusical: Story = {
  decorators: [withNotation('musical')],
};

export const KeyCamelot: Story = {
  decorators: [withNotation('camelot')],
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('button');
    await expect(trigger).toHaveTextContent('8A · A minor');
    await userEvent.click(trigger);
    const body = within(canvasElement.ownerDocument.body);
    await expect(
      await body.findByRole('option', { name: '9A · E minor' }),
    ).toBeInTheDocument();
  },
};

export const Bpm: Story = {
  decorators: [withNotation('camelot')],
  args: { rule: { field: 'bpm', op: 'between', value: '124', value2: '130' } },
};
