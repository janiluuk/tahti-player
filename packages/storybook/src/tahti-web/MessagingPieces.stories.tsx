import type { Meta, StoryObj } from '@storybook/react-vite';
import type { JamParticipant } from '@tahti-web/api/jam-types';
import type { ChatDm } from '@tahti-web/api/messages';
import { DmBlockButton } from '@tahti-web/components/DmBlockButton';
import { DmThreadMessages } from '@tahti-web/components/DmThreadMessages';
import { JamParticipantList } from '@tahti-web/components/JamParticipantList';
import { expect, fn, within } from 'storybook/test';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';

const MESSAGES: ChatDm[] = [
  {
    id: 'm1',
    senderUsername: 'listener-one',
    senderDisplayName: 'Listener One',
    senderAvatarUrl: null,
    body: 'Loved the set last night!',
    createdAt: '2026-11-02T21:10:00.000Z',
    isMine: false,
  },
  {
    id: 'm2',
    senderUsername: 'artist',
    senderDisplayName: 'An Artist',
    senderAvatarUrl: null,
    body: 'Thank you! Next one is on Friday.',
    createdAt: '2026-11-02T21:12:00.000Z',
    isMine: true,
  },
];

const PARTICIPANTS: JamParticipant[] = [
  {
    userId: 'u1',
    username: 'artist',
    displayName: 'An Artist',
    avatarUrl: null,
    role: 'HOST',
    canControl: true,
    joinedAt: '2026-11-03T18:00:00.000Z',
  },
  {
    userId: 'u2',
    username: 'listener-one',
    displayName: 'Listener One',
    avatarUrl: null,
    role: 'GUEST',
    canControl: false,
    joinedAt: '2026-11-03T18:02:00.000Z',
  },
];

const meta: Meta = {
  title: 'Tahti/Components/Messaging pieces',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A direct-message thread, the block button for a conversation, and the Jam participant list.',
      },
    },
  },
  decorators: [withTahtiRouter('/messages'), withMockAuth(MOCK_USERS.artist)],
};

export default meta;
type Story = StoryObj;

export const Thread: Story = {
  render: () => (
    <DmThreadMessages
      messages={MESSAGES}
      hasMore
      loadingOlder={false}
      onLoadOlder={fn()}
    />
  ),
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText('Loved the set last night!'),
    ).toBeVisible();
  },
};

export const Block: Story = {
  render: () => (
    <DmBlockButton
      username="listener-one"
      displayName="Listener One"
      blocked={false}
      onChange={fn()}
    />
  ),
};

export const JamParticipants: Story = {
  render: () => (
    <JamParticipantList
      participants={PARTICIPANTS}
      onSetControl={fn()}
      onRemove={fn()}
    />
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Listener One')).toBeVisible();
  },
};
