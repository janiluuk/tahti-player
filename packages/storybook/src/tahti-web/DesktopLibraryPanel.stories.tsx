import type { Meta, StoryObj } from '@storybook/react-vite';
import { DesktopLibraryPanel } from '@tahti-web/components/DesktopLibraryPanel';
import { useLocalLibraryStore } from '@tahti-web/stores/localLibraryStore';
import { useEffect } from 'react';

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
