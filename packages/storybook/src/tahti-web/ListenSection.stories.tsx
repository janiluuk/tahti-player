import type { Meta, StoryObj } from '@storybook/react-vite';
import { ListenSection } from '@tahti-web/components/listen-view/ListenSection';
import { fn } from 'storybook/test';

import { CardsRow } from '@tahti-player/ui';

const channels = [
  { id: 'northern-lights', title: 'Northern Lights', subtitle: 'Live now' },
  { id: 'aurora-set', title: 'Aurora Set', subtitle: 'Replay' },
  { id: 'deep-forest', title: 'Deep Forest', subtitle: 'Live now' },
];

const meta = {
  title: 'Tahti/Listen/ListenSection',
  component: ListenSection,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'One Listen dashboard section (Tahti Radio, Radio, On air, New tracks). Each section fetches on its own and shows its own loading state, an error with Retry, or a real empty state, so a slow or failed endpoint never reads as "nothing here" and never blocks the other sections. Once ready with content it renders its children (usually a `CardsRow`).',
      },
    },
  },
  tags: ['autodocs'],
  args: {
    title: 'On air',
    badge: 'Live',
    status: 'ready',
    empty: false,
    emptyTitle: 'Nobody is on air right now',
    emptyDescription: 'Live and replaying channels show up here.',
    onRetry: fn(),
    children: (
      <CardsRow
        title="On air"
        badge="Live"
        items={channels}
        labels={{
          filterPlaceholder: 'Filter channels…',
          nothingFound: 'Nothing matches that filter.',
        }}
      />
    ),
  },
} satisfies Meta<typeof ListenSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {};

export const Loading: Story = {
  args: { status: 'loading' },
};

export const LoadFailed: Story = {
  args: { status: 'error' },
};

export const Empty: Story = {
  args: { empty: true },
};
