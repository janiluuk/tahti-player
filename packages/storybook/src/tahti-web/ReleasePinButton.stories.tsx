import type { Meta, StoryObj } from '@storybook/react-vite';
import { ReleasePinButton } from '@tahti-web/views/studio/ReleasePinButton';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { withToaster } from './_fixtures/track-release';
import { findToast } from './_lib/play';

const meta: Meta<typeof ReleasePinButton> = {
  title: 'Tahti/Studio/ReleasePinButton',
  component: ReleasePinButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          "Studio → Releases row action that pins a published release to the top of the artist's public profile, or unpins it. Hidden for unpinned drafts; a pinned draft can still be unpinned.",
      },
    },
  },
  tags: ['autodocs'],
  decorators: [withToaster()],
  args: {
    release: {
      id: 'rel-mock-1',
      title: 'After Hours',
      type: 'ALBUM',
      state: 'PUBLISHED',
      releaseDate: '2026-06-01',
      smartLinkSlug: 'after-hours',
      pinnedAt: null,
    },
    onChange: fn(),
  },
  render: function Render(args) {
    const [pinnedAt, setPinnedAt] = useState(args.release.pinnedAt ?? null);
    return (
      <ReleasePinButton
        release={{ ...args.release, pinnedAt }}
        onChange={(next) => {
          args.onChange(next);
          setPinnedAt(next);
        }}
      />
    );
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const PinAndUnpin: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const pin = canvas.getByRole('button', { name: 'Pin to profile' });
    await expect(pin).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(pin);
    await findToast(canvasElement, 'Pinned to your profile.');
    await expect(args.onChange).toHaveBeenLastCalledWith(expect.any(String));
    const unpin = await canvas.findByRole('button', {
      name: 'Unpin from profile',
    });
    await expect(unpin).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(unpin);
    await findToast(canvasElement, 'Unpinned from your profile.');
    await waitFor(() => expect(args.onChange).toHaveBeenLastCalledWith(null));
    await expect(
      await canvas.findByRole('button', { name: 'Pin to profile' }),
    ).toBeVisible();
  },
};

export const Pinned: Story = {
  args: {
    release: {
      id: 'rel-mock-1',
      title: 'After Hours',
      type: 'ALBUM',
      state: 'PUBLISHED',
      releaseDate: '2026-06-01',
      smartLinkSlug: 'after-hours',
      pinnedAt: '2026-09-20T12:00:00.000Z',
    },
  },
};

// Drafts never reach the profile, so there's nothing to pin.
export const UnpinnedDraft: Story = {
  args: {
    release: {
      id: 'rel-mock-3',
      title: 'Studio Sessions Vol. 1',
      type: 'EP',
      state: 'DRAFT',
      releaseDate: '2026-08-01',
      smartLinkSlug: 'studio-sessions-vol-1',
      pinnedAt: null,
    },
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('button')).toBeNull();
  },
};

// A pin left on a draft can still be cleared.
export const PinnedDraft: Story = {
  args: {
    release: {
      id: 'rel-mock-3',
      title: 'Studio Sessions Vol. 1',
      type: 'EP',
      state: 'DRAFT',
      releaseDate: '2026-08-01',
      smartLinkSlug: 'studio-sessions-vol-1',
      pinnedAt: '2026-07-01T12:00:00.000Z',
    },
  },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole('button', { name: 'Unpin from profile' }),
    ).toBeVisible();
  },
};
