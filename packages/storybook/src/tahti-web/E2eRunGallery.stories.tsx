import type { Meta, StoryObj } from '@storybook/react-vite';
import { E2eRunGallery } from '@tahti-web/components/E2eRunGallery';

const meta: Meta<typeof E2eRunGallery> = {
  title: 'Tahti/Studio/E2eRunGallery',
  component: E2eRunGallery,
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="p-6">
      <E2eRunGallery />
    </div>
  ),
};
