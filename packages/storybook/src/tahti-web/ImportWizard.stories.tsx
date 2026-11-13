import type { Meta, StoryObj } from '@storybook/react-vite';
import { ImportWizard } from '@tahti-web/views/studio/upload/ImportWizard';

import { withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof ImportWizard> = {
  title: 'Tahti/Studio/ImportWizard',
  component: ImportWizard,
  decorators: [withTahtiRouter('/library/upload')],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const PickAService: Story = {
  args: {
    start: 'pick',
    onClose: () => undefined,
  },
};
