import type { Meta, StoryObj } from '@storybook/react-vite';
import { DiscoverGatewayBackground } from '@tahti-web/components/DiscoverGatewayBackground';

/**
 * Quiet gateway ambience behind Discover — a low-opacity AURORA
 * `ChannelVisualizer`, shown only for themes with visualization support
 * (`isThemeVisualizationEnabled`; the Storybook default theme,
 * `nuclear:tahti-dark`, is one of them). Mirrors apps/web's BgCanvas
 * `subtle` role without requiring the global Settings ambient toggle.
 */
const meta: Meta<typeof DiscoverGatewayBackground> = {
  title: 'Tahti/Discover/DiscoverGatewayBackground',
  component: DiscoverGatewayBackground,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="relative h-64 w-full overflow-hidden rounded-lg">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
