import type { Meta, StoryObj } from '@storybook/react-vite';
import { ItunesImportDialog } from '@tahti-web/components/desktop-library/ItunesImportDialog';
import type {
  NativeItunesImport,
  NativeItunesImportResult,
  NativeItunesPreview,
  NativeRootMapping,
} from '@tahti-web/lib/nativeLibrary';
import { useMemo, useState } from 'react';
import { fn } from 'storybook/test';

import { Button } from '@tahti-player/ui';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const OLD_FOLDER = '/Volumes/Old Drive/iTunes/iTunes Media';

/** Before a remap most files are missing; any remap of the music folder finds them. */
function previewFor(mappings: NativeRootMapping[]): NativeItunesPreview {
  const remapped = mappings.some((mapping) => mapping.from === OLD_FOLDER);
  return {
    musicFolder: OLD_FOLDER,
    tracks: 4812,
    tracksInCatalog: remapped ? 1210 : 12,
    tracksToImport: remapped ? 3480 : 40,
    tracksMissing: remapped ? 2 : 4640,
    tracksUnsupported: 96,
    tracksNotLocal: 24,
    duplicateTracks: 3,
    previouslyImported: 0,
    playlists: 38,
    playlistEntries: 2210,
    playlistFolders: 4,
    playlistsAlreadyImported: 0,
    builtinPlaylistsSkipped: 9,
    missingExamples: remapped
      ? ['/Users/you/Music/iTunes Media/Music/Unknown Artist/Voice Memo.m4a']
      : [
          `${OLD_FOLDER}/Music/Aphex Twin/Selected Ambient Works/01 Xtal.flac`,
          `${OLD_FOLDER}/Music/Björk/Homogenic/03 Jóga.mp3`,
          `${OLD_FOLDER}/Music/Boards of Canada/Geogaddi/05 Julie and Candy.m4a`,
        ],
    unsupportedExamples: [
      `${OLD_FOLDER}/Music/Radiohead/In Rainbows/01 15 Step.m4p`,
      `${OLD_FOLDER}/Movies/Concert.m4v`,
    ],
  };
}

const RESULT: NativeItunesImportResult = {
  tracksLinked: 1210,
  tracksImported: 3476,
  tracksFailed: 4,
  tracksMissing: 2,
  tracksUnsupported: 96,
  tracksNotLocal: 24,
  duplicateTracks: 3,
  playsAdded: 58_214,
  skipsAdded: 1_902,
  ratingsApplied: 812,
  lovedTagged: 140,
  fieldsFilled: 2_380,
  fieldsKeptFromFile: 611,
  bpmApplied: 204,
  playlistsCreated: 36,
  playlistsRenamed: 2,
  playlistsAlreadyImported: 0,
  playlistEntries: 2210,
  playlistEntriesUnavailable: 31,
  playlistEntriesSkipped: 12,
  errors: [
    {
      path: '/Users/you/Music/iTunes Media/Music/Various/Mix/07 Broken.flac',
      error: 'Invalid FLAC stream',
    },
    {
      path: '/Users/you/Music/iTunes Media/Music/Demo/Take 2.wav',
      error: 'Unsupported WAV encoding',
    },
  ],
};

function fakeItunesImport(): NativeItunesImport {
  return {
    pick: async () => '/Users/you/Music/Library.xml',
    preview: async (_path, mappings) => {
      await wait(700);
      return previewFor(mappings);
    },
    commit: async () => {
      await wait(2500);
      return RESULT;
    },
  };
}

const pickFolder = async () => '/Users/you/Music/iTunes Media';

const meta = {
  title: 'Tahti/Misc/ItunesImportDialog',
  component: ItunesImportDialog,
  parameters: {
    docs: {
      description: {
        component:
          'Desktop Local files → "Import iTunes library". Choose an iTunes / Music.app `Library.xml` export, see how many tracks resolve to files (in the library already, to import, missing, unsupported, not local) and how many playlists come along, add old → new folder remaps when the music has moved and preview again, then import and read the summary with the tracks that could not be resolved. In Storybook the library was exported from another drive: add the suggested folder remap, choose a new folder and preview again to find the files.',
      },
    },
  },
  args: {
    isOpen: true,
    onClose: fn(),
    onImported: fn(),
    itunesImport: fakeItunesImport(),
    pickFolder,
  },
} satisfies Meta<typeof ItunesImportDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    const [open, setOpen] = useState(true);
    const itunesImport = useMemo(() => fakeItunesImport(), []);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Import iTunes library</Button>
        <ItunesImportDialog
          {...args}
          isOpen={open}
          itunesImport={itunesImport}
          onClose={() => setOpen(false)}
        />
      </>
    );
  },
};
