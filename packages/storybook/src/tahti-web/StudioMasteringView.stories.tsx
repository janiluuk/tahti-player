import type { Meta, StoryObj } from '@storybook/react-vite';
import { StudioMasteringView } from '@tahti-web/views/studio/StudioMasteringView';
import { expect, within } from 'storybook/test';

import {
  MOCK_USERS,
  withMockAuth,
  withPageSurface,
  withTahtiRouter,
} from './_lib/decorators';
import { expectVisible } from './_lib/play';

const meta: Meta<typeof StudioMasteringView> = {
  title: 'Tahti/Studio/StudioMasteringView',
  component: StudioMasteringView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Reference mastering for one sound (`/studio/mastering/$id`): pick a commercially mastered reference file and match the track to it in a web worker (loudness, tone, levels, limiting), then play or download the WAV. Links back to Sounds, the metadata form and the audio editor.',
      },
    },
  },
  args: { soundId: 'arch-mock-1' },
  decorators: [
    withTahtiRouter('/studio/mastering/arch-mock-1'),
    withMockAuth(MOCK_USERS.artist),
    withPageSurface(),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const NoReferenceYet: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { name: 'Reference mastering' }),
    ).toBeVisible();
    await expectVisible(await canvas.findByText('Northern Lights — Live Set'));
    await expect(
      canvas.getByText(
        /This is the track that will be matched to your reference\./,
      ),
    ).toBeVisible();
    await expect(
      canvas.getByText(
        'A commercially mastered track (or any reference) you want this track to sound like.',
      ),
    ).toBeVisible();
    await expect(
      canvas.getByText('Drop an audio file, or browse for one.'),
    ).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Match to reference' }),
    ).toBeDisabled();
    await expect(canvas.getByRole('link', { name: /Sounds/ })).toHaveAttribute(
      'href',
      '/studio/sounds',
    );
    await expect(
      canvas.getByRole('link', { name: 'Audio editor' }),
    ).toHaveAttribute('href', '/studio/sounds/arch-mock-1/editor');
    await expect(canvas.getByRole('link', { name: 'Metadata' })).toBeVisible();
  },
};
