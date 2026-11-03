import type { Meta, StoryObj } from '@storybook/react-vite';
import { StemsPanel } from '@tahti-web/views/studio/pro-editor/StemsPanel';
import { expect, within } from 'storybook/test';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof StemsPanel> = {
  title: 'Tahti/Studio/Pro editor/Stems',
  component: StemsPanel,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Pro editor → Stems: split a track into stems, follow the job, and send the result to the multitrack timeline.',
      },
    },
  },
  args: { soundId: 'arch-mock-2', onSendToMultitrack: () => undefined },
  decorators: [
    withTahtiRouter('/studio/sounds/arch-mock-2/editor'),
    withMockAuth(MOCK_USERS.artist),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expect(
      (await within(canvasElement).findAllByRole('heading')).length,
    ).toBeGreaterThan(0);
  },
};
