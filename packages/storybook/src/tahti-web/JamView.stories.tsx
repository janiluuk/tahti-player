import type { Meta, StoryObj } from '@storybook/react-vite';
import { usePlayerStore } from '@tahti-web/stores/playerStore';
import { JamView } from '@tahti-web/views/JamView';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { stubMediaPlayback } from './_fixtures/artist';
import {
  GUEST_LISTENING,
  GUEST_WITH_CONTROL,
  installFakeJam,
  JAM_CODE,
  jamSession,
} from './_fixtures/jam';
import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';
import { expectNoDialog, findDialog } from './_lib/play';

const meta: Meta<typeof JamView> = {
  title: 'Tahti/Social/JamView',
  component: JamView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          "A Tahti Jam at `/jam/$code`: everyone hears the host's music in sync. The host hands out playback control and removes guests; a guest taps Play along to start their own audio. Stories run against a fake Jam API and SSE stream (`_fixtures/jam.ts`).",
      },
    },
  },
  args: { code: JAM_CODE },
  render: (args) => (
    <div className="flex h-screen flex-col">
      <JamView {...args} />
    </div>
  ),
  decorators: [withTahtiRouter(`/jam/${JAM_CODE}`)],
  beforeEach: () => {
    const restoreMedia = stubMediaPlayback();
    return () => {
      restoreMedia();
      usePlayerStore.setState({ currentId: null, status: 'idle', queue: [] });
    };
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

async function findJam(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  await expect(
    await canvas.findByRole('heading', { name: 'Tahti Jam' }),
  ).toBeVisible();
  await expect(await canvas.findByText('Live')).toBeVisible();
  return canvas;
}

export const Host: Story = {
  decorators: [withMockAuth(MOCK_USERS.artist)],
  beforeEach: () => installFakeJam(jamSession()),
  play: async ({ canvasElement, step }) => {
    const canvas = await findJam(canvasElement);

    await step('code and participants', async () => {
      await expect(canvas.getByText(JAM_CODE)).toBeVisible();
      await expect(canvas.getByText('3 jamming')).toBeVisible();
      await expect(canvas.getByText('Host')).toBeVisible();
    });

    await step('hand playback control to a guest', async () => {
      const toggle = canvas.getByRole('switch', {
        name: `Let ${GUEST_WITH_CONTROL} control playback`,
      });
      await expect(toggle).not.toBeChecked();
      await userEvent.click(toggle);
      await waitFor(() => expect(toggle).toBeChecked());
    });

    await step('remove a guest after confirming', async () => {
      await userEvent.click(
        canvas.getByRole('button', {
          name: `Remove ${GUEST_LISTENING} from the Jam`,
        }),
      );
      const dialog = await findDialog(
        canvasElement,
        `Remove ${GUEST_LISTENING} from the Jam?`,
      );
      await userEvent.click(dialog.getByRole('button', { name: 'Remove' }));
      await expectNoDialog(canvasElement);
      await expect(await canvas.findByText('2 jamming')).toBeVisible();
      await expect(canvas.queryByText(GUEST_LISTENING)).toBeNull();
    });

    await expect(
      canvas.getByRole('button', { name: /End Jam for everyone/ }),
    ).toBeVisible();
  },
};

export const GuestWithControl: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  beforeEach: () =>
    installFakeJam(
      jamSession({
        participants: jamSession().participants.map((p) =>
          p.userId === MOCK_USERS.listener.id ? { ...p, canControl: true } : p,
        ),
      }),
    ),
  play: async ({ canvasElement, step }) => {
    const canvas = await findJam(canvasElement);

    await step('now playing and the control notice', async () => {
      await expect(canvas.getByText('Borrowed Light')).toBeVisible();
      await expect(
        canvas.getByText('The host has given you control of playback.'),
      ).toBeVisible();
      await expect(
        canvas.queryByRole('switch', { name: /control playback/ }),
      ).toBeNull();
      await expect(
        canvas.getByRole('button', { name: /Leave Jam/ }),
      ).toBeVisible();
    });

    await step('pause and resume for everyone', async () => {
      await userEvent.click(
        canvas.getByRole('button', { name: /Pause for everyone/ }),
      );
      await userEvent.click(
        await canvas.findByRole('button', { name: /Play for everyone/ }),
      );
      await expect(
        await canvas.findByRole('button', { name: /Pause for everyone/ }),
      ).toBeVisible();
    });

    await step('play along starts this device', async () => {
      await userEvent.click(canvas.getByRole('button', { name: /Play along/ }));
      await expect(
        await canvas.findByText(
          /pausing or resuming your player does it for everyone/,
        ),
      ).toBeVisible();
      await expect(
        canvas.queryByRole('button', { name: /Play along/ }),
      ).toBeNull();
      await waitFor(() =>
        expect(usePlayerStore.getState().currentId).toBe('nl-cat-1'),
      );
    });
  },
};

export const GuestListening: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  beforeEach: () => installFakeJam(jamSession()),
  play: async ({ canvasElement }) => {
    const canvas = await findJam(canvasElement);
    await expect(
      canvas.queryByRole('button', { name: /for everyone/ }),
    ).toBeNull();
    await expect(
      canvas.getByRole('button', { name: /Play along/ }),
    ).toBeVisible();
    await expect(canvas.getByText('Can control')).toBeVisible();
  },
};

export const Ended: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  beforeEach: () => installFakeJam(jamSession(), { endsAfterJoin: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('This Jam has ended')).toBeVisible();
    await expect(
      canvas.getByText('The host closed the session.'),
    ).toBeVisible();
  },
};

export const InvalidLink: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  beforeEach: () => installFakeJam(jamSession(), { joinFails: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('Jam not found')).toBeVisible();
    await expect(
      canvas.getByText('This Jam link is invalid or has ended.'),
    ).toBeVisible();
  },
};

export const SignedOut: Story = {
  decorators: [withMockAuth(null)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Log in to join this Jam')).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Log in' })).toBeVisible();
  },
};
