import type { Meta, StoryObj } from '@storybook/react-vite';
import { ListenSection } from '@tahti-web/components/listen-view/ListenSection';
import { expect, fn, waitFor, within } from 'storybook/test';

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
    badgeColor: 'green',
    status: 'ready',
    empty: false,
    emptyTitle: 'Nobody is on air right now',
    emptyDescription: 'Live and replaying channels show up here.',
    onRetry: fn(),
    children: (
      <CardsRow
        title="On air"
        badge="Live"
        badgeColor="green"
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

export const LoadingKeepsReadyHeight: Story = {
  render: (args) => (
    <div className="flex flex-col gap-8">
      <div data-testid="loading-slot">
        <ListenSection {...args} status="loading" />
      </div>
      <div data-testid="ready-slot">
        <ListenSection {...args} status="ready" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const loading = canvas.getByTestId('loading-slot');
    const ready = canvas.getByTestId('ready-slot');
    await waitFor(() =>
      expect(Math.round(loading.getBoundingClientRect().height)).toBe(
        Math.round(ready.getBoundingClientRect().height),
      ),
    );
  },
};

export const LoadingList: Story = {
  args: { status: 'loading', skeleton: 'list', title: 'New tracks' },
};

export const LoadFailed: Story = {
  args: { status: 'error' },
};

export const Empty: Story = {
  args: { empty: true },
};
