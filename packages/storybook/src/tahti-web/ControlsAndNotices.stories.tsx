import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppErrorFallback } from '@tahti-web/components/AppErrorFallback';
import { AutoplayUnmuteNotice } from '@tahti-web/components/AutoplayUnmuteNotice';
import { HelpKeyboardShortcuts } from '@tahti-web/components/HelpKeyboardShortcuts';
import { PlaylistNameDialog } from '@tahti-web/components/PlaylistNameDialog';
import { RestrictionNotice } from '@tahti-web/components/RestrictionNotice';
import { RotationMirrorToggle } from '@tahti-web/components/RotationMirrorToggle';
import { usePlayerStore } from '@tahti-web/stores/playerStore';
import { useState } from 'react';
import { expect, fn, screen } from 'storybook/test';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta = {
  title: 'Tahti/Components/Controls and notices',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The rotation mirror switch, the playlist name dialog, keyboard shortcuts help, the autoplay unmute notice, a restriction notice and the app error fallback.',
      },
    },
  },
  decorators: [withTahtiRouter('/'), withMockAuth(MOCK_USERS.artist)],
};

export default meta;
type Story = StoryObj;

function MirrorToggle() {
  const [checked, setChecked] = useState(false);
  return <RotationMirrorToggle checked={checked} onChange={setChecked} />;
}

export const RotationMirror: Story = { render: () => <MirrorToggle /> };

export const PlaylistName: Story = {
  render: () => (
    <PlaylistNameDialog
      isOpen
      title="New playlist"
      confirmLabel="Create"
      initialName="Late night"
      onClose={fn()}
      onSubmit={fn(async () => undefined)}
    />
  ),
  play: async () => {
    await expect(await screen.findByDisplayValue('Late night')).toBeVisible();
  },
};

export const KeyboardShortcuts: Story = {
  render: () => <HelpKeyboardShortcuts />,
};

export const AutoplayUnmute: Story = {
  beforeEach: () => {
    usePlayerStore.setState({ autoplayRestoreMuted: false, muted: true });
  },
  render: () => <AutoplayUnmuteNotice />,
};

export const UploadRestriction: Story = {
  render: () => <RestrictionNotice type="UPLOAD" />,
};

export const ErrorFallback: Story = {
  render: () => (
    <AppErrorFallback error={new Error('Something broke')} reset={fn()} />
  ),
};
