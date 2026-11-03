import type { Meta, StoryObj } from '@storybook/react-vite';
import { FanSubOrderBreakdown } from '@tahti-web/components/FanSubOrderBreakdown';
import { PlatformStatsStrip } from '@tahti-web/components/PlatformStatsStrip';
import { VersionRenderProgress } from '@tahti-web/components/VersionRenderProgress';
import { fn } from 'storybook/test';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta = {
  title: 'Tahti/Components/Data strips',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The platform stats strip, the fan subscription order breakdown and a version render progress line.',
      },
    },
  },
  decorators: [withTahtiRouter('/'), withMockAuth(MOCK_USERS.artist)],
};

export default meta;
type Story = StoryObj;

export const PlatformStats: Story = { render: () => <PlatformStatsStrip /> };

export const FanSubscriptionOrder: Story = {
  render: () => <FanSubOrderBreakdown />,
};

export const RenderProgress: Story = {
  render: () => (
    <VersionRenderProgress
      soundId="arch-mock-2"
      versionId="ver-mock-1"
      onDone={fn()}
    />
  ),
};
