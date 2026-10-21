import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  Badge,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
  HorizontalScroll,
} from '@tahti-player/ui';

const meta = {
  title: 'Components/DataTable',
  component: DataTable,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Plain read-only table for small static data (payouts, grants, status, inventories). Use CatalogTable for large server-sorted lists and TrackTable for playable tracks. Wrap in HorizontalScroll with a min width when columns would squash on phones.',
      },
    },
  },
} satisfies Meta<typeof DataTable>;

export default meta;
type Story = StoryObj<typeof DataTable>;

const payouts = [
  {
    id: '1',
    date: '2026-10-01',
    description: 'Fan subscriptions',
    net: '€42.10',
    state: 'PAID',
  },
  {
    id: '2',
    date: '2026-09-01',
    description: 'Fan subscriptions',
    net: '€38.75',
    state: 'PAID',
  },
  {
    id: '3',
    date: '2026-11-01',
    description: 'Fan subscriptions',
    net: '—',
    state: 'PENDING',
  },
];

export const Default: Story = {
  render: () => (
    <div className="p-4">
      <HorizontalScroll label="Payout history">
        <DataTable className="min-w-[430px]">
          <DataTableHead>
            <DataTableRow>
              <DataTableHeaderCell>Date</DataTableHeaderCell>
              <DataTableHeaderCell>Description</DataTableHeaderCell>
              <DataTableHeaderCell>Net to you</DataTableHeaderCell>
              <DataTableHeaderCell>State</DataTableHeaderCell>
            </DataTableRow>
          </DataTableHead>
          <DataTableBody>
            {payouts.map((row) => (
              <DataTableRow key={row.id}>
                <DataTableCell className="text-foreground-secondary">
                  {row.date}
                </DataTableCell>
                <DataTableCell className="font-medium">
                  {row.description}
                </DataTableCell>
                <DataTableCell className="tabular-nums">
                  {row.net}
                </DataTableCell>
                <DataTableCell>
                  <Badge
                    variant="pill"
                    color={row.state === 'PAID' ? 'green' : 'yellow'}
                  >
                    {row.state}
                  </Badge>
                </DataTableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTable>
      </HorizontalScroll>
    </div>
  ),
};
