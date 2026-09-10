import type { Meta, StoryObj } from '@storybook/react-vite';
import { TrackInsightsPanel } from '@tahti-web/components/TrackInsightsPanel';

const meta: Meta<typeof TrackInsightsPanel> = {
  title: 'Tahti/Studio/TrackInsightsPanel',
  component: TrackInsightsPanel,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Track performance metrics, listener geography, and daily downloads. Lives on Studio → Music → Sounds via track Insights.',
      },
    },
  },
  args: { kind: 'sound', id: 'track-northern-signals' },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ThirtyDays: Story = {};
