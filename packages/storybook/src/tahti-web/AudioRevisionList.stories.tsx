import type { Meta, StoryObj } from '@storybook/react-vite';
import { addMockSoundVersion } from '@tahti-web/api/sound-versions';
import { AudioRevisionList } from '@tahti-web/components/AudioRevisionList';

import { withMockAuth } from './_lib/decorators';

const SOUND_ID = 'story-revision-track';
addMockSoundVersion(SOUND_ID, {
  versionLabel: 'Trimmed intro',
  filename: 'trimmed.wav',
});

const meta: Meta<typeof AudioRevisionList> = {
  title: 'Tahti/Studio/AudioRevisionList',
  component: AudioRevisionList,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Track-detail revision list: upload a new audio file, preview any version, compare A/B, then activate. Lives on Studio → Sounds → track details.',
      },
    },
  },
  decorators: [withMockAuth()],
  args: {
    soundId: SOUND_ID,
    trackTitle: 'Night Bus',
    artistName: 'Northern Lights',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const WithCompare: Story = {};
