import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  PageEmpty,
  PageError,
  PageErrorBanner,
  PageLoading,
} from '@tahti-web/components/PageStates';

const meta: Meta = {
  title: 'Tahti/Page/PageStates',
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj;

export const Loading: Story = {
  render: () => <PageLoading label="Loading session…" />,
};

export const EmptyInbox: Story = {
  render: () => (
    <PageEmpty
      icon="inbox"
      title="No messages yet"
      description="When someone sends you a message, it'll show up here."
    />
  ),
};

export const EmptyRadio: Story = {
  render: () => (
    <PageEmpty
      icon="radio"
      title="Nothing scheduled"
      description="Add a broadcast to fill this slot."
    />
  ),
};

export const Error: Story = {
  render: () => (
    <PageError
      description="Couldn't reach the API — check your connection and retry."
      onRetry={() => {}}
    />
  ),
};

export const ErrorBanner: Story = {
  render: () => (
    <PageErrorBanner
      title="Could not refresh the list"
      description="Showing what we loaded earlier."
      onRetry={() => {}}
    />
  ),
};

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <PageLoading label="Loading…" />
      <PageEmpty title="Nothing here" description="Empty state example." />
      <PageError description="Something went wrong." onRetry={() => {}} />
      <PageError title="No retry" description={undefined} />
    </div>
  ),
};
