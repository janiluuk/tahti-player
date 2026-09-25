import type { Meta, StoryObj } from '@storybook/react-vite';
import { CalendarDaysIcon, ListIcon } from 'lucide-react';
import { useState } from 'react';

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

export const IconOnly: Story = { render: () => <Demo iconOnly /> };

export const WithLabels: Story = { render: () => <Demo /> };
