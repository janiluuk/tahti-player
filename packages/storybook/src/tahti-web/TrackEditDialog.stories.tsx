import type { Meta, StoryObj } from '@storybook/react-vite';
import { TrackEditDialog } from '@tahti-web/components/TrackEditDialog';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import {
  EDIT_SOUND,
  seedPurchaseTier,
  seedStudioSounds,
  STORY_TIER_ID,
  withToaster,
} from './_fixtures/track-release';
import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';
import { findDialog, findToast, selectTab, withinBody } from './_lib/play';

type Scope = ReturnType<typeof within>;

const meta: Meta<typeof TrackEditDialog> = {
  title: 'Tahti/Track/TrackEditDialog',
  component: TrackEditDialog,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [
    withToaster(),
    withTahtiRouter(`/studio/sounds/${EDIT_SOUND.id}`),
    withMockAuth(MOCK_USERS.artist),
  ],
  // The dialog self-fetches the sound (fetchStudioSound) from the Studio
  // mock store; seeding it there means Save round-trips through the real
  // mock PATCH, and `onSaved` receives what was saved.
  beforeEach: seedStudioSounds([EDIT_SOUND]),
  args: {
    soundId: EDIT_SOUND.id,
    onClose: fn(),
    onSaved: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

async function openEditor(canvasElement: HTMLElement): Promise<Scope> {
  const dialog = await findDialog(canvasElement, 'Edit track');
  await dialog.findByRole('tab', { name: 'Basics' });
  await selectTab(dialog, 'Basics');
  return dialog;
}

/** Picks `option` from the Select labelled `label` (options portal to body). */
async function choose(
  canvasElement: HTMLElement,
  scope: Scope,
  label: string,
  option: string | RegExp,
) {
  await userEvent.click(scope.getByRole('button', { name: label }));
  await userEvent.click(
    await withinBody(canvasElement).findByRole('option', { name: option }),
  );
  await waitFor(() =>
    expect(scope.getByRole('button', { name: label })).toHaveTextContent(
      option,
    ),
  );
}

async function save(canvasElement: HTMLElement, dialog: Scope) {
  await userEvent.click(dialog.getByRole('button', { name: 'Save changes' }));
  await findToast(canvasElement, 'Track details saved.');
}

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const dialog = await openEditor(canvasElement);
    await expect(dialog.getByRole('textbox', { name: 'Title' })).toHaveValue(
      'Kaamos Bloom',
    );
    for (const tab of ['Audio', 'Sharing', 'Export', 'Advanced', 'Basics']) {
      await selectTab(dialog, tab);
    }
  },
};

// Basics: remove a tag chip, add a new tag and a subgenre, then save.
export const EditTags: Story = {
  play: async ({ canvasElement, args }) => {
    const dialog = await openEditor(canvasElement);
    await expect(dialog.getByText('2 / 20')).toBeVisible();
    await userEvent.click(
      dialog.getByRole('button', { name: 'Remove Helsinki' }),
    );
    await expect(
      dialog.queryByRole('button', { name: 'Remove Helsinki' }),
    ).toBeNull();

    const body = withinBody(canvasElement);
    await userEvent.type(
      dialog.getByRole('combobox', { name: 'Add a tag' }),
      'field recordings',
    );
    await userEvent.click(
      await body.findByRole('option', { name: 'Add "field recordings"' }),
    );
    await dialog.findByRole('button', { name: 'Remove field recordings' });

    await userEvent.type(
      dialog.getByRole('combobox', { name: 'Add a subgenre' }),
      'Dub techno',
    );
    await userEvent.click(
      await body.findByRole('option', { name: 'Add "Dub techno"' }),
    );
    await dialog.findByRole('button', { name: 'Remove Dub techno' });

    await save(canvasElement, dialog);
    await expect(args.onSaved).toHaveBeenCalledWith(
      expect.objectContaining({
        tags: ['night drive', 'field recordings'],
        subGenres: ['Drone', 'Dub techno'],
      }),
    );
  },
};

// Advanced: an out-of-range BPM shows inline and blocks Save; fixing it
// saves the manual BPM/key/version, the AI label and the venue.
export const AdvancedAnalysis: Story = {
  play: async ({ canvasElement, args }) => {
    const dialog = await openEditor(canvasElement);
    await selectTab(dialog, 'Advanced');
    await expect(dialog.getByText(/Detected: 118 BPM, Am/)).toBeVisible();

    const bpm = dialog.getByRole('spinbutton', { name: 'BPM' });
    await expect(bpm).toBeDisabled();
    await userEvent.click(
      dialog.getByRole('switch', { name: 'Use detected BPM and key' }),
    );
    await expect(bpm).toBeEnabled();
    await userEvent.type(bpm, '20');
    await expect(
      dialog.getByText('BPM must be between 40 and 300.'),
    ).toBeVisible();
    await userEvent.click(dialog.getByRole('button', { name: 'Save changes' }));
    await findToast(canvasElement, 'BPM must be between 40 and 300.');
    await expect(args.onSaved).not.toHaveBeenCalled();

    await userEvent.clear(bpm);
    await userEvent.type(bpm, '124');
    await userEvent.type(dialog.getByRole('textbox', { name: 'Key' }), 'F#m');
    await userEvent.type(
      dialog.getByRole('textbox', { name: 'Version' }),
      'Extended Mix',
    );
    const ai = dialog.getByRole('switch', { name: 'Made with generative AI' });
    await userEvent.click(ai);
    await expect(ai).toHaveAttribute('aria-checked', 'true');
    await choose(
      canvasElement,
      dialog,
      'Recorded at (optional)',
      'Kuudes Linja · Helsinki',
    );

    await save(canvasElement, dialog);
    await expect(args.onSaved).toHaveBeenCalledWith(
      expect.objectContaining({
        bpm: 124,
        musicalKey: 'F#m',
        mixVersion: 'Extended Mix',
        useDetectedBpmKey: false,
        isAiGenerated: true,
        venueId: 'venue-1',
      }),
    );
  },
};

// Sharing: limit playback to fan subscribers, switch downloads off (the
// follow/repost gates go away) and back on, require a follow, then make
// the track private.
export const SharingAndAccess: Story = {
  play: async ({ canvasElement, args }) => {
    const dialog = await openEditor(canvasElement);
    await selectTab(dialog, 'Sharing');
    await choose(canvasElement, dialog, 'Access', 'Fan subscribers only');

    const downloads = dialog.getByRole('switch', { name: 'Allow downloads' });
    await expect(downloads).toHaveAttribute('aria-checked', 'true');
    await expect(
      dialog.getByRole('switch', { name: 'Require a follow' }),
    ).toBeVisible();
    await userEvent.click(downloads);
    await waitFor(() =>
      expect(
        dialog.queryByRole('switch', { name: 'Require a follow' }),
      ).toBeNull(),
    );
    await userEvent.click(downloads);
    await userEvent.click(
      await dialog.findByRole('switch', { name: 'Require a follow' }),
    );

    await choose(
      canvasElement,
      dialog,
      'Audience',
      'Private - only you and share links',
    );

    await save(canvasElement, dialog);
    await expect(args.onSaved).toHaveBeenCalledWith(
      expect.objectContaining({
        isPublic: false,
        downloadsEnabled: true,
        followToDownload: true,
        repostToDownload: false,
        accessMode: 'SUBSCRIBERS_ONLY',
        purchaseTierId: null,
      }),
    );
  },
};

// Sell the track through the artist's one-time purchase tier.
export const PurchaseTierAccess: Story = {
  beforeEach: () => seedPurchaseTier(MOCK_USERS.artist.username),
  play: async ({ canvasElement, args }) => {
    const dialog = await openEditor(canvasElement);
    await selectTab(dialog, 'Sharing');
    await choose(canvasElement, dialog, 'Access', 'Night Drive single — €3');
    await save(canvasElement, dialog);
    await expect(args.onSaved).toHaveBeenCalledWith(
      expect.objectContaining({
        accessMode: 'PURCHASE',
        purchaseTierId: STORY_TIER_ID,
      }),
    );
  },
};

// Audio: source properties and the quick fixes for a processed upload.
export const AudioTab: Story = {
  play: async ({ canvasElement }) => {
    const dialog = await openEditor(canvasElement);
    await selectTab(dialog, 'Audio');
    await expect(
      dialog.getByText('This track is stored as Tahti audio.'),
    ).toBeVisible();
    await expect(
      dialog.getByRole('button', { name: 'Normalize audio' }),
    ).toBeVisible();
    await expect(
      dialog.getByRole('button', { name: 'Trim silence' }),
    ).toBeVisible();
  },
};
