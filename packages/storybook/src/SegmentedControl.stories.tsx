import type { Meta, StoryObj } from '@storybook/react-vite';
import { CalendarDaysIcon, ListIcon } from 'lucide-react';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';

import { SegmentedControl } from '@tahti-player/ui';

const meta: Meta<typeof SegmentedControl> = {
  title: 'Components/SegmentedControl',
  component: SegmentedControl,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SegmentedControl>;

const OPTIONS = [
  {
    id: 'cards',
    label: 'Card view',
    icon: <CalendarDaysIcon size={14} aria-hidden />,
  },
  { id: 'list', label: 'List view', icon: <ListIcon size={14} aria-hidden /> },
] as const;

function Demo({ iconOnly }: { iconOnly?: boolean }) {
  const [value, setValue] = useState<'cards' | 'list'>('cards');
  return (
    <SegmentedControl
      aria-label="View"
      options={OPTIONS}
      value={value}
      onChange={setValue}
      iconOnly={iconOnly}
    />
  );
}

async function expectSwitchesView(canvasElement: HTMLElement) {
  const group = within(
    within(canvasElement).getByRole('radiogroup', { name: 'View' }),
  );
  const cards = group.getByRole('radio', { name: 'Card view' });
  const list = group.getByRole('radio', { name: 'List view' });
  await expect(cards).toHaveAttribute('aria-checked', 'true');
  await expect(list).toHaveAttribute('aria-checked', 'false');
  await userEvent.click(list);
  await expect(list).toHaveAttribute('aria-checked', 'true');
  await expect(cards).toHaveAttribute('aria-checked', 'false');
}

export const IconOnly: Story = {
  render: () => <Demo iconOnly />,
  play: ({ canvasElement }) => expectSwitchesView(canvasElement),
};

export const WithLabels: Story = {
  render: () => <Demo />,
  play: ({ canvasElement }) => expectSwitchesView(canvasElement),
};
