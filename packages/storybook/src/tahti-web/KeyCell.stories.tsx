import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { KeyCell } from '@tahti-web/components/desktop-library/KeyCell';
import type { KeyNotation } from '@tahti-web/lib/musicalKey';
import { useDjPrefsStore } from '@tahti-web/stores/djPrefsStore';
import { expect, within } from 'storybook/test';

function withNotation(keyNotation: KeyNotation): Decorator {
  return (Story) => {
    useDjPrefsStore.setState({ keyNotation });
    return <Story />;
  };
}

const meta: Meta<typeof KeyCell> = {
  title: 'Tahti/Desktop/KeyCell',
  component: KeyCell,
  args: { value: 'Am' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Musical: Story = {
  decorators: [withNotation('musical')],
  args: { value: '8A' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Am')).toBeVisible();
  },
};

export const Camelot: Story = {
  decorators: [withNotation('camelot')],
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('8A')).toBeVisible();
  },
};

export const OpenKey: Story = {
  decorators: [withNotation('openKey')],
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('1m')).toBeVisible();
  },
};

export const UnreadableKey: Story = {
  decorators: [withNotation('camelot')],
  args: { value: 'atonal' },
};

export const NoKey: Story = {
  decorators: [withNotation('camelot')],
  args: { value: null },
};
