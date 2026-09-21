import type { Meta, StoryObj } from '@storybook/react-vite';
import { DesktopLibraryPanel } from '@tahti-web/components/DesktopLibraryPanel';
import type { TahtiNativeLibrary } from '@tahti-web/lib/nativeLibrary';
import { useLocalLibraryStore } from '@tahti-web/stores/localLibraryStore';
import { useEffect, useRef } from 'react';

const meta: Meta<typeof DesktopLibraryPanel> = {
  title: 'Tahti/Misc/DesktopLibraryPanel',
  component: DesktopLibraryPanel,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  decorators: [
    (Story) => {
      useEffect(() => {
        useLocalLibraryStore.getState().clear();
      }, []);
      return (
        <div className="border-border h-[28rem] w-80 border">
          <Story />
        </div>
      );
    },
  ],
};

export const SearchableLibrary: Story = {
  decorators: [
    (Story) => {
      useEffect(() => {
        useLocalLibraryStore.setState({
          tracks: [
            {
              id: 'huone',
              title: 'Huone',
              artist: 'Vladislav Delay',
              fileName: 'Vladislav Delay - Huone.flac',
              fileSize: 38_400_000,
              mimeType: 'audio/flac',
              lastModified: Date.now(),
              objectUrl: 'blob:storybook/huone',
              addedAt: new Date().toISOString(),
            },
            {
              id: 'field-recording',
              title: 'Harbour field recording',
              artist: 'Local file',
              fileName: 'harbour-field-recording.wav',
              fileSize: 12_800_000,
              mimeType: 'audio/wav',
              lastModified: Date.now(),
              objectUrl: '',
              addedAt: new Date().toISOString(),
            },
          ],
        });
        return () => useLocalLibraryStore.getState().clear();
      }, []);
      return (
        <div className="border-border h-[34rem] w-96 border">
          <Story />
        </div>
      );
    },
  ],
};

export const MissingNativeFile: Story = {
  decorators: [
    (Story) => {
      const previousLibrary = useRef(globalThis.__TAHTI_NATIVE_LIBRARY__);
      const nativeLibrary = useRef<TahtiNativeLibrary>({
        list: async () => ({
          tracks: [
            {
              id: 'missing-native-track',
              title: 'Archive recording',
              artist: 'Local artist',
              album: 'Disconnected drive',
              format: 'flac',
              duration: 240,
              sizeBytes: 42_000_000,
              available: false,
              unavailableSince: '2026-09-18T12:00:00Z',
              path: '/Volumes/Archive/Music/archive.flac',
              sampleRate: 44100,
              channels: 2,
              bitsPerSample: 16,
              albumArtist: '',
              trackNo: null,
              discNo: null,
              year: null,
              genre: '',
              comment: '',
              bitrateKbps: null,
              addedAt: '2026-09-18 12:00:00',
              rating: 0,
              color: '',
              playCount: 0,
              lastPlayedAt: null,
            },
          ],
          total: 1,
        }),
        import: async () => ({
          imported: 0,
          skipped: 0,
          errors: [],
          cancelled: false,
        }),
        importFolder: async () => ({
          imported: 0,
          skipped: 0,
          errors: [],
          cancelled: false,
        }),
        importPaths: async () => ({
          imported: 0,
          skipped: 0,
          errors: [],
          cancelled: false,
        }),
        cancelImport: async () => undefined,
        resolve: async () => '',
        remove: async () => undefined,
        removeMany: async () => 0,
        catalog: {
          listTags: async () => [],
          provenance: async () => [],
          duplicates: async () => [],
          onHashProgress: () => () => undefined,
        } as unknown as TahtiNativeLibrary['catalog'],
        playlists: {
          list: async () => [],
          create: async (name: string) => ({
            id: 'pl',
            name,
            trackCount: 0,
            durationSec: 0,
            unavailableCount: 0,
            createdAt: '',
            updatedAt: '',
          }),
          rename: async (id: string, name: string) => ({
            id,
            name,
            trackCount: 0,
            durationSec: 0,
            unavailableCount: 0,
            createdAt: '',
            updatedAt: '',
          }),
          duplicate: async (id: string) => ({
            id,
            name: 'copy',
            trackCount: 0,
            durationSec: 0,
            unavailableCount: 0,
            createdAt: '',
            updatedAt: '',
          }),
          delete: async () => undefined,
          addTracks: async () => 0,
          entries: async () => ({ entries: [], total: 0 }),
          entryIds: async () => [],
          moveEntries: async () => undefined,
          removeEntries: async () => [],
          restoreEntries: async () => undefined,
          setOrder: async () => undefined,
          trackIds: async () => [],
          exportM3u: async () => null,
          importPreview: async () => null,
          pickRelinkFolder: async () => null,
          importCommit: async (_source: string, name: string) => ({
            playlist: {
              id: 'pl',
              name,
              trackCount: 0,
              durationSec: 0,
              unavailableCount: 0,
              createdAt: '',
              updatedAt: '',
            },
            linked: 0,
            imported: 0,
            unresolved: 0,
          }),
          relinkEntry: async () => false,
        },
        matchingIds: async () => [],
        filterOptions: async () => ({
          formats: ['flac'],
          yearMin: null,
          yearMax: null,
        }),
        prepareBatch: async () => ({ items: [], unavailable: 0 }),
        reveal: async () => undefined,
        facets: async () => [],
        totals: async () => ({
          trackCount: 1,
          durationSec: 240,
          sizeBytes: 42_000_000,
        }),
        listRoots: async () => [
          {
            id: 'root-archive',
            path: '/Volumes/Archive/Music',
            createdAt: '2026-09-18T12:00:00Z',
            lastScannedAt: null,
            trackCount: 1,
            missingCount: 1,
            available: false,
          },
        ],
        addRoot: async () => null,
        removeRoot: async () => undefined,
        rescanRoots: async () => ({
          imported: 0,
          skipped: 0,
          missing: 0,
          recovered: 0,
          errors: [],
          cancelled: false,
        }),
        relinkRoot: async () => null,
        onImportProgress: () => () => {},
        onFilesDropped: () => () => {},
        listUnavailable: async () => [
          {
            id: 'missing-native-track',
            title: 'Archive recording',
            artist: 'Local artist',
            album: 'Disconnected drive',
            format: 'flac',
            duration: 240,
            sizeBytes: 42_000_000,
            available: false,
            unavailableSince: '2026-09-18T12:00:00Z',
            path: '/Volumes/Archive/Music/archive.flac',
            sampleRate: 44100,
            channels: 2,
            bitsPerSample: 16,
            albumArtist: '',
            trackNo: null,
            discNo: null,
            year: null,
            genre: '',
            comment: '',
            bitrateKbps: null,
            addedAt: '2026-09-18 12:00:00',
            rating: 0,
            color: '',
            playCount: 0,
            lastPlayedAt: null,
          },
        ],
        rescan: async () => [],
        relink: async () => null,
      });
      globalThis.__TAHTI_NATIVE_LIBRARY__ = nativeLibrary.current;
      useEffect(
        () => () => {
          globalThis.__TAHTI_NATIVE_LIBRARY__ = previousLibrary.current;
        },
        [],
      );
      return (
        <div className="border-border h-[28rem] w-96 border">
          <Story />
        </div>
      );
    },
  ],
};
