import type { Meta, StoryObj } from '@storybook/react-vite';
import { StudioReleaseDetailView } from '@tahti-web/views/studio/StudioReleaseDetailView';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import {
  audioFile,
  RELEASE_ID,
  releasesWithUploadStates,
  withToaster,
} from './_fixtures/track-release';
import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';
import { mockData } from './_lib/mock-data';
import { findDialog, findToast, selectTab } from './_lib/play';

type Scope = ReturnType<typeof within>;

const meta: Meta<typeof StudioReleaseDetailView> = {
  title: 'Tahti/Studio/StudioReleaseDetailView',
  component: StudioReleaseDetailView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Studio → Releases → one release: header with artwork, then Overview, Smart links (stats, targets, the smart-link playlist with audio uploads, and the "Powered by Tahti" footer toggle), Credits, Versions, Fingerprinting and Export tabs.',
      },
    },
    // rel-mock-1 plus one track per upload state: no audio yet, processing
    // failed, and still scanning.
    mockData: mockData({ studioReleases: releasesWithUploadStates }),
  },
  args: { id: RELEASE_ID },
  decorators: [
    withToaster(),
    withTahtiRouter(`/studio/releases/${RELEASE_ID}`),
    withMockAuth(MOCK_USERS.artist),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

async function openSmartLinks(canvasElement: HTMLElement): Promise<Scope> {
  const canvas = within(canvasElement);
  await canvas.findByRole('heading', { name: 'After Hours' });
  await selectTab(canvas, 'Smart links');
  return canvas;
}

export const Overview: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { name: 'After Hours' }),
    ).toBeVisible();
    await expect(canvas.getByText('ALBUM · PUBLISHED')).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Published' }),
    ).toBeDisabled();
  },
};

// Every tab of the release renders its panel.
export const SwitchTabs: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('heading', { name: 'After Hours' });
    await selectTab(canvas, 'Smart links');
    await expect(await canvas.findByText('Smart-link playlist')).toBeVisible();
    await selectTab(canvas, 'Credits');
    await expect(canvas.getByText('Track credits')).toBeVisible();
    await selectTab(canvas, 'Versions');
    await selectTab(canvas, 'Fingerprinting');
    await expect(
      canvas.getByText('Fingerprinting', { selector: 'h2, h3' }),
    ).toBeVisible();
    await selectTab(canvas, 'Export');
    await expect(canvas.getByText('Export release')).toBeVisible();
    await selectTab(canvas, 'Overview');
    await expect(canvas.getByText('Details')).toBeVisible();
  },
};

// Smart links: click stats per service, and the footer toggle saves.
export const SmartLinks: Story = {
  play: async ({ canvasElement }) => {
    const canvas = await openSmartLinks(canvasElement);
    await expect(await canvas.findByText('Smart link stats')).toBeVisible();
    await expect(canvas.getByText('482')).toBeVisible();
    await expect(canvas.getByText('20%')).toBeVisible();
    const clicks = within(canvas.getByTestId('smart-link-clicks'));
    await expect(clicks.getByText('51')).toBeVisible();

    const footer = canvas.getByRole('switch', {
      name: 'Show "Powered by Tahti" footer',
    });
    await expect(footer).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(footer);
    await findToast(canvasElement, 'Footer shown on the smart link.');
    await waitFor(() => expect(footer).toHaveAttribute('aria-checked', 'true'));
  },
};

// Each track without library audio shows its upload state: an upload
// button, "Processing failed" with "Upload again", or "Processing".
export const TrackUploadStates: Story = {
  play: async ({ canvasElement }) => {
    const canvas = await openSmartLinks(canvasElement);
    await expect(
      await canvas.findByRole('button', { name: 'Upload audio' }),
    ).toBeVisible();
    await expect(canvas.getByText('Processing failed')).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Upload again' }),
    ).toBeVisible();
    await expect(canvas.getByText('Processing')).toBeVisible();
  },
};

// Upload audio for a track that has none: progress, then processing.
export const UploadTrackAudio: Story = {
  play: async ({ canvasElement }) => {
    const canvas = await openSmartLinks(canvasElement);
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Upload audio' }),
    );
    await userEvent.upload(
      canvas.getByLabelText('Audio for Polar Night'),
      audioFile(),
    );
    await expect(
      await canvas.findByRole('meter', { name: /Uploading Polar Night/ }),
    ).toBeVisible();
    await findToast(
      canvasElement,
      'Audio uploaded. It is being processed now.',
    );
    await waitFor(() =>
      expect(canvas.queryByRole('button', { name: 'Upload audio' })).toBeNull(),
    );
    await expect(canvas.getAllByText('Processing')).toHaveLength(2);
  },
};

// "Upload a new track" creates the track from a file and uploads it.
export const UploadNewTrack: Story = {
  play: async ({ canvasElement }) => {
    const canvas = await openSmartLinks(canvasElement);
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Upload a new track' }),
    );
    const dialog = await findDialog(canvasElement, 'Upload a new track');
    const upload = dialog.getByRole('button', { name: 'Upload track' });
    await expect(upload).toBeDisabled();
    await userEvent.upload(
      dialog.getByLabelText('Audio file'),
      audioFile('midnight-sun.wav'),
    );
    await expect(
      dialog.getByRole('textbox', { name: 'Track title' }),
    ).toHaveValue('midnight-sun');
    await userEvent.click(upload);
    await expect(
      await dialog.findByRole('meter', { name: /Uploading midnight-sun/ }),
    ).toBeVisible();
    await findToast(
      canvasElement,
      'Audio uploaded. It is being processed now.',
    );
    await expect(await canvas.findByText('midnight-sun')).toBeVisible();
  },
};
