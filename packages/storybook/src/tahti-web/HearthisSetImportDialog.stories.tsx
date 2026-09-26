import type { Meta, StoryObj } from '@storybook/react-vite';
import { HearthisSetImportDialog } from '@tahti-web/components/desktop-library/HearthisSetImportDialog';
import type {
  NativeProviderImport,
  NativeProviderImportProgress,
  NativeProviderImportSpace,
} from '@tahti-web/lib/nativeLibrary';
import { useMemo, useState } from 'react';
import { fn } from 'storybook/test';

import { Button } from '@tahti-player/ui';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const MB = 1024 ** 2;

/** One entry has no listed size; the rest are 90 MB each. */
const fitsSpace = (entries: number): NativeProviderImportSpace => ({
  neededBytes: (entries - 1) * 90 * MB,
  sized: entries - 1,
  unknownSize: 1,
  alreadyImported: 0,
  freeBytes: 48 * 1024 * MB,
  verdict: 'fits',
});

const notEnoughSpace = (entries: number): NativeProviderImportSpace => ({
  ...fitsSpace(entries),
  freeBytes: 60 * MB,
  verdict: 'notEnough',
});

/** Downloads each entry in a few progress steps; the last entry fails. */
function fakeProviderImport(
  space: (entries: number) => NativeProviderImportSpace = fitsSpace,
): NativeProviderImport {
  const listeners = new Set<(event: NativeProviderImportProgress) => void>();
  let cancelled = false;
  const emit = (event: NativeProviderImportProgress) =>
    listeners.forEach((listener) => listener(event));
  return {
    destination: async (_provider, setTitle) =>
      `/Users/you/Music/Tahti/hearthis.at/${setTitle}`,
    start: async (request) => {
      cancelled = false;
      const trackIds: string[] = [];
      const failures: { remoteId: string; title: string; error: string }[] = [];
      for (const [index, entry] of request.entries.entries()) {
        if (cancelled) {
          emit({
            remoteId: entry.remoteId,
            state: 'cancelled',
            receivedBytes: 0,
            totalBytes: null,
            error: null,
          });
          continue;
        }
        for (const part of [1, 2, 3]) {
          emit({
            remoteId: entry.remoteId,
            state: 'downloading',
            receivedBytes: part * 30,
            totalBytes: 100,
            error: null,
          });
          await wait(300);
        }
        const failed = index === request.entries.length - 1;
        if (failed) {
          failures.push({
            remoteId: entry.remoteId,
            title: entry.title,
            error: 'Download failed: 503 Service Unavailable',
          });
        } else {
          trackIds.push(`track-${entry.remoteId}`);
        }
        emit({
          remoteId: entry.remoteId,
          state: failed ? 'failed' : 'imported',
          receivedBytes: 0,
          totalBytes: null,
          error: failed ? 'Download failed: 503 Service Unavailable' : null,
        });
      }
      return {
        imported: trackIds.length,
        skipped: 0,
        failures,
        cancelled,
        playlistId: request.playlistName ? 'playlist-1' : null,
        trackIds,
      };
    },
    space: async (request) => {
      await wait(600);
      return space(request.entries.length);
    },
    cancel: async () => {
      cancelled = true;
    },
    onProgress: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

const meta = {
  title: 'Tahti/Misc/HearthisSetImportDialog',
  component: HearthisSetImportDialog,
  parameters: {
    docs: {
      description: {
        component:
          'Desktop Local files → "Import hearthis.at set". Paste a set link or pick one of your sets, review which tracks the uploader offers for download, see how much disk space the files need against what the destination has free (unknown sizes stay unknown; the download is blocked when the known sizes alone do not fit), then download them into the library with per-track progress, cancel, and retry of failures. In Storybook the mock set has four tracks, one stream-only, and the fake download fails the last track.',
      },
    },
  },
  args: {
    isOpen: true,
    onClose: fn(),
    onImported: fn(),
    providerImport: fakeProviderImport(),
  },
} satisfies Meta<typeof HearthisSetImportDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    const [open, setOpen] = useState(true);
    const providerImport = useMemo(() => fakeProviderImport(), []);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Import hearthis.at set</Button>
        <HearthisSetImportDialog
          {...args}
          isOpen={open}
          providerImport={providerImport}
          onClose={() => setOpen(false)}
        />
      </>
    );
  },
};

/** The known file sizes need more than the destination has free. */
export const NotEnoughSpace: Story = {
  render: (args) => {
    const [open, setOpen] = useState(true);
    const providerImport = useMemo(
      () => fakeProviderImport(notEnoughSpace),
      [],
    );
    return (
      <>
        <Button onClick={() => setOpen(true)}>Import hearthis.at set</Button>
        <HearthisSetImportDialog
          {...args}
          isOpen={open}
          providerImport={providerImport}
          onClose={() => setOpen(false)}
        />
      </>
    );
  },
};
