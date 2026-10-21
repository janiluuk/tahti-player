import { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { SelectableList, SelectableListItem } from '@tahti-player/ui';

const meta = {
  title: 'Components/SelectableList',
  component: SelectableList,
  tags: ['autodocs'],
} satisfies Meta<typeof SelectableList>;

export default meta;

type Story = StoryObj<typeof SelectableList>;

const users: SelectableListItem[] = [
  {
    id: 'ada',
    title: 'Ada Lovelace',
    subtitle: '@ada',
    meta: 'Board',
  },
  {
    id: 'grace',
    title: 'Grace Hopper',
    subtitle: '@grace · suspended',
    meta: 'Artist',
  },
  {
    id: 'margaret',
    title: 'Margaret Hamilton',
    subtitle: '@margaret',
    meta: 'Listener',
  },
];

export const Interactive: Story = {
  render: () => {
    const [selected, setSelected] = useState('ada');

    return (
      <div className="w-72">
        <SelectableList
          items={users}
          selected={selected}
          onChange={setSelected}
        />
        <p className="text-foreground/60 mt-2 text-xs">Selected: {selected}</p>
      </div>
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <div className="w-72">
      <SelectableList
        items={users}
        selected="ada"
        onChange={() => {}}
        disabled
      />
    </div>
  ),
};
