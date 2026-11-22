import type { Meta, StoryObj } from '@storybook/react-vite';
import { LinkPageEditor } from '@tahti-web/views/studio/LinkPageEditor';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta = {
  title: 'Tahti/Studio/LinkPageEditor',
  component: LinkPageEditor,
  decorators: [withTahtiRouter('/studio/profile/link-page'), withMockAuth()],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof LinkPageEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
