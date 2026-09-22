import type { Meta, StoryObj } from '@storybook/react-vite';
import { DeliveryTab } from '@tahti-web/views/studio/distribution/DeliveryTab';
import { useState } from 'react';

const meta: Meta<typeof DeliveryTab> = {
  title: 'Tahti/Studio/Distribution/DeliveryTab',
  component: DeliveryTab,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    revelatorStatus: null,
    revelatorId: null,
    billing: null,
    busy: false,
    canSubmit: true,
    confirmSubmit: false,
    setConfirmSubmit: () => {},
    onSubmit: () => {},
    showRoyalties: false,
    royaltiesLoaded: false,
    royalties: [],
  },
  render: function Render(args) {
    const [confirmSubmit, setConfirmSubmit] = useState(args.confirmSubmit);
    return (
      <DeliveryTab
        {...args}
        confirmSubmit={confirmSubmit}
        setConfirmSubmit={setConfirmSubmit}
      />
    );
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ReadyToSubmit: Story = {
  args: {
    billing: {
      paid: false,
      feeCents: 990,
      waived: false,
      studioIncludedRemaining: 0,
      distributionPaidAt: null,
    },
  },
};

export const Submitted: Story = {
  args: {
    revelatorStatus: 'pending',
    revelatorId: 'rev-8841',
    canSubmit: false,
    billing: {
      paid: true,
      feeCents: 990,
      waived: false,
      studioIncludedRemaining: null,
      distributionPaidAt: '2026-09-01T10:00:00Z',
    },
  },
};

export const WithRoyalties: Story = {
  args: {
    revelatorStatus: 'live',
    revelatorId: 'rev-8841',
    canSubmit: false,
    showRoyalties: true,
    royaltiesLoaded: true,
    royalties: [
      {
        id: 'r1',
        releaseId: 'rel-1',
        releaseTitle: 'Northern Lights EP',
        periodStart: '2026-07-01',
        periodEnd: '2026-07-31',
        amountCents: 4210,
        currency: 'EUR',
        streams: 18234,
        syncedAt: '2026-08-05T06:00:00Z',
      },
    ],
  },
};
