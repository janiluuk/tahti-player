import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminStreamManagerPanel } from '@tahti-web/components/AdminStreamManagerPanel';

import { ADMIN_SWEEP_DOCS } from './_lib/adminStoryDocs';
import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AdminStreamManagerPanel> = {
  title: 'Tahti/Admin/AdminStreamManagerPanel',
  component: AdminStreamManagerPanel,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `${ADMIN_SWEEP_DOCS} StatChip cells already. Leave stream controls.`,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/admin/streams'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const LiveStreams: Story = {};
