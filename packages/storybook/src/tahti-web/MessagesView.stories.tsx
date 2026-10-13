import type { Meta, StoryObj } from '@storybook/react-vite';
import { MessagesView } from '@tahti-web/views/MessagesView';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import {
  ARTIST_THREAD,
  DM_USER,
  GONE_THREAD,
  inboxData,
  LISTENER_THREAD,
} from './_fixtures/messages';
import { withToaster } from './_fixtures/track-release';
import {
  withMockAuth,
  withPageSurface,
  withTahtiRouter,
} from './_lib/decorators';
import { expectNoDialog, findDialog, findToast } from './_lib/play';

const meta: Meta<typeof MessagesView> = {
  title: 'Tahti/Social/MessagesView',
  component: MessagesView,
  parameters: {
    layout: 'fullscreen',
    mockData: inboxData,
    docs: {
      description: {
        component:
          'Direct messages at `/messages`: start a conversation by username or from your contacts, the inbox (artists and moderators get a badge), and the open thread with older-message paging, blocking, and the notice for an account that is gone.',
      },
    },
  },
  decorators: [
    withMockAuth(DM_USER),
    withPageSurface(),
    withTahtiRouter('/messages'),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

function inboxButton(canvasElement: HTMLElement, name: RegExp) {
  return within(canvasElement).findByRole('button', { name });
}

export const Inbox: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('inbox with role badge and contacts', async () => {
      const artist = await inboxButton(canvasElement, /^Northern Lights/);
      await expect(within(artist).getByText('Artist')).toBeVisible();
      await expect(artist).toHaveTextContent(
        'Of course - tag the channel when it airs.',
      );
      await expect(
        await inboxButton(canvasElement, /^Former listener/),
      ).toHaveTextContent('No messages yet');
      await expect(
        canvas.getByText('Select a conversation.'),
      ).toBeInTheDocument();
      const contacts = within(
        canvas.getByRole('region', { name: 'Your contacts' }),
      );
      await expect(
        contacts.getByRole('button', { name: 'Message Listener One' }),
      ).toHaveAttribute('title', 'You follow each other');
      await expect(
        contacts.getByRole('button', { name: 'Message Northern Lights' }),
      ).toHaveAttribute('title', 'You follow');
    });

    await step('search fills in the username', async () => {
      const field = canvas.getByLabelText('Message @');
      await userEvent.type(field, 'liste');
      await userEvent.click(canvas.getByRole('button', { name: 'Search' }));
      await waitFor(() => expect(field).toHaveValue('listener'));
    });

    await step('a contact opens their thread', async () => {
      await userEvent.click(
        canvas.getByRole('button', { name: 'Message Listener One' }),
      );
      const listener = await inboxButton(canvasElement, /^Listener One/);
      await waitFor(() =>
        expect(listener).toHaveAttribute('aria-current', 'page'),
      );
      await expect(
        await within(canvas.getByTestId('dm-thread')).findByText(
          'Loved the set last night!',
        ),
      ).toBeVisible();
    });
  },
};

export const ArtistThread: Story = {
  args: { threadId: ARTIST_THREAD },
  decorators: [withToaster()],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const thread = within(await canvas.findByTestId('dm-thread'));

    await step('messages with the artist badge, older page', async () => {
      const reply = await thread.findByText(
        'Of course - tag the channel when it airs.',
      );
      await expect(within(reply).getByText('Artist')).toBeVisible();
      await userEvent.click(
        thread.getByRole('button', { name: 'Load older messages' }),
      );
      await waitFor(() =>
        expect(
          thread.queryByRole('button', { name: 'Load older messages' }),
        ).toBeNull(),
      );
    });

    await step('block asks first, then hides the composer', async () => {
      await userEvent.click(thread.getByRole('button', { name: 'Block' }));
      const dialog = await findDialog(canvasElement, 'Block Northern Lights?');
      await userEvent.click(dialog.getByRole('button', { name: 'Block' }));
      await expectNoDialog(canvasElement);
      await findToast(canvasElement, 'Blocked Northern Lights.');
      await expect(thread.getByText(/You blocked this account/)).toBeVisible();
      await expect(
        thread.queryByPlaceholderText('Write a message…'),
      ).toBeNull();
    });

    await step('unblock brings it back', async () => {
      await userEvent.click(thread.getByRole('button', { name: 'Unblock' }));
      await expect(
        await thread.findByPlaceholderText('Write a message…'),
      ).toBeVisible();
    });
  },
};

export const SendMessage: Story = {
  args: { threadId: LISTENER_THREAD },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const thread = within(await canvas.findByTestId('dm-thread'));
    await thread.findByText('Loved the set last night!');
    const send = thread.getByRole('button', { name: 'Send' });
    await expect(send).toBeDisabled();
    await userEvent.type(
      thread.getByPlaceholderText('Write a message…'),
      'Next show is on Friday{Enter}',
    );
    await expect(
      await thread.findByText('Next show is on Friday'),
    ).toBeVisible();
    await expect(
      await inboxButton(canvasElement, /^Listener One/),
    ).toHaveTextContent('Next show is on Friday');
  },
};

export const AccountGone: Story = {
  args: { threadId: GONE_THREAD },
  play: async ({ canvasElement }) => {
    const thread = within(
      await within(canvasElement).findByTestId('dm-thread'),
    );
    await expect(
      await thread.findByText('This account is no longer available'),
    ).toBeVisible();
    await expect(thread.queryByRole('button', { name: 'Block' })).toBeNull();
    await expect(thread.queryByPlaceholderText('Write a message…')).toBeNull();
  },
};

export const SignedOut: Story = {
  decorators: [withMockAuth(null)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Sign in to read DMs.')).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Log in' })).toBeVisible();
  },
};
