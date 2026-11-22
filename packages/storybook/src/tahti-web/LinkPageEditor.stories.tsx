import type { Meta, StoryObj } from '@storybook/react-vite';
import { LinkPageEditor } from '@tahti-web/views/studio/LinkPageEditor';

const meta = {
  title: 'Tahti/Studio/LinkPageEditor',
  component: LinkPageEditor,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof LinkPageEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
