import type { Meta, StoryObj } from '@storybook/react-vite';
import { TrackInsightsPanel } from '@tahti-web/components/TrackInsightsPanel';
import { expect, userEvent, within } from 'storybook/test';

const meta: Meta<typeof TrackInsightsPanel> = {
  title: 'Tahti/Studio/TrackInsightsPanel',
  component: TrackInsightsPanel,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Track performance metrics, listening patterns (time of day / day of week / calendar by unique listeners), listener geography, and daily downloads. Lives on Studio → Music → Sounds via track Insights. ReferrerSources Pages mode uses soundId-scoped audience buckets.',
      },
    },
  },
  args: { kind: 'sound', id: 'track-northern-signals' },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ThirtyDays: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText('Where listeners came from'),
    ).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('radio', { name: 'Pages' }));
    await expect(
      await canvas.findByRole('link', { name: /instagram\.com\/p\/abc/ }),
    ).toBeInTheDocument();
  },
};
