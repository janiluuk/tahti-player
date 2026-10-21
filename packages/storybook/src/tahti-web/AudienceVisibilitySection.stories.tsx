import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  AudienceVisibilitySection,
  type TrackVisibility,
} from '@tahti-web/components/AudienceVisibilitySection';
import { useState } from 'react';

import { withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AudienceVisibilitySection> = {
  title: 'Tahti/Studio/AudienceVisibilitySection',
  component: AudienceVisibilitySection,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  // The STASH visibility state renders a <Link>, which needs a router context.
  decorators: [withTahtiRouter('/studio')],
};

export default meta;
type Story = StoryObj<typeof meta>;

function InteractiveAudience() {
  const [visibility, setVisibility] = useState<TrackVisibility>('STASH');
  const [tierIds, setTierIds] = useState<string[]>(['tier-mock-1']);
  return (
    <AudienceVisibilitySection
      visibility={visibility}
      onVisibilityChange={setVisibility}
      tierIds={tierIds}
      onTierIdsChange={setTierIds}
    />
  );
}

export const StashWithTier: Story = {
  render: () => <InteractiveAudience />,
};

export const Public: Story = {
  args: {
    visibility: 'PUBLIC',
    tierIds: [],
    onVisibilityChange: () => undefined,
    onTierIdsChange: () => undefined,
  },
};
