import type { Meta, StoryObj } from '@storybook/react-vite';
import type { StudioRelease } from '@tahti-web/api/studio-types';
import { GuidesTab } from '@tahti-web/views/studio/distribution/GuidesTab';
import { ReleaseOpsPanel } from '@tahti-web/views/studio/distribution/ReleaseOpsPanel';
import { ReleaseSmartLinksPanel } from '@tahti-web/views/studio/release-detail/ReleaseSmartLinksPanel';
import { expect, within } from 'storybook/test';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';

const RELEASE: StudioRelease = {
  id: 'rel-mock-1',
  title: 'After Hours',
  type: 'ALBUM',
  state: 'PUBLISHED',
  releaseDate: '2026-04-01',
  smartLinkSlug: 'after-hours',
  tracks: [
    { id: 'rt-1', position: 1, title: 'Night Transit', soundId: 'arch-mock-2' },
  ],
};

const meta: Meta = {
  title: 'Tahti/Studio/Distribution panels',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Studio → Releases → Distribution: the step-by-step guides and the per-release operations panel.',
      },
    },
  },
  decorators: [
    withTahtiRouter('/studio/distribution'),
    withMockAuth(MOCK_USERS.artist),
  ],
};

export default meta;
type Story = StoryObj;

export const Guides: Story = {
  render: () => <GuidesTab />,
  play: async ({ canvasElement }) => {
    await expect(
      (await within(canvasElement).findAllByRole('heading')).length,
    ).toBeGreaterThan(0);
  },
};

export const ReleaseOps: Story = {
  render: () => <ReleaseOpsPanel release={RELEASE} />,
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByText(/After Hours/),
    ).toBeInTheDocument();
  },
};

export const SmartLinks: Story = {
  render: () => (
    <ReleaseSmartLinksPanel
      release={RELEASE}
      sounds={[]}
      onTargetsSaved={() => undefined}
      onReleaseChange={() => undefined}
    />
  ),
  play: async ({ canvasElement }) => {
    await expect(
      (await within(canvasElement).findAllByRole('heading')).length,
    ).toBeGreaterThan(0);
  },
};
