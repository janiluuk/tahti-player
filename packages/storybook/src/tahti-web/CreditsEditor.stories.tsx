import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReleaseCredit } from '@tahti-web/api/studio-types';
import { CreditsEditor } from '@tahti-web/views/studio/distribution/CreditsEditor';
import { useState } from 'react';

const meta: Meta<typeof CreditsEditor> = {
  title: 'Tahti/Studio/Distribution/CreditsEditor',
  component: CreditsEditor,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

function Stateful({
  initial,
  busy = false,
}: {
  initial: ReleaseCredit[];
  busy?: boolean;
}) {
  const [credits, setCredits] = useState(initial);
  return (
    <CreditsEditor credits={credits} setCredits={setCredits} busy={busy} />
  );
}

export const Empty: Story = { render: () => <Stateful initial={[]} /> };

export const Populated: Story = {
  render: () => (
    <Stateful
      initial={[
        { role: 'writer', name: 'Liina Virtanen' },
        {
          role: 'producer',
          name: 'Northern Lights',
          artistUsername: 'northern-lights',
        },
        { role: 'label', name: 'Tahti Records' },
      ]}
    />
  ),
};

export const Busy: Story = {
  render: () => (
    <Stateful initial={[{ role: 'performer', name: 'DJ Moonlight' }]} busy />
  ),
};
