import type { Meta, StoryObj } from '@storybook/react-vite';
import { StudioBrandingView } from '@tahti-web/views/studio/StudioBrandingView';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof StudioBrandingView> = {
  title: 'Tahti/Studio/StudioBrandingView',
  component: StudioBrandingView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Studio → Branding: profile picture, gallery and press kit. Renders against the mock API layer.',
      },
    },
  },
  decorators: [withTahtiRouter('/studio/branding'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
