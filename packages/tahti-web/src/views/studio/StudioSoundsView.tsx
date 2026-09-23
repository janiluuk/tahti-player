import { AudioLinesIcon, FolderIcon } from 'lucide-react';

import { EmptyState, TabLabel, Tabs, ViewShell } from '@tahti-player/ui';

import { AddToMusicActions } from '../../components/AddToMusicActions';
import { PageLoading } from '../../components/PageStates';
import { StashFilesPanel } from '../../components/StashFilesPanel';
import { StudioGate } from '../../components/StudioGate';
import { StudioNav } from '../../components/StudioNav';
import { StudioPanel } from '../../components/StudioPanel';
import { SoundFilters } from './sounds/SoundFilters';
import { SoundRow } from './sounds/SoundRow';
import { SoundsDialogs } from './sounds/SoundsDialogs';
import { FOLDERS, useStudioSoundsState } from './sounds/useStudioSoundsState';

const FOLDER_TABS = [
  { id: FOLDERS[0], label: 'Tracks', icon: AudioLinesIcon },
  { id: FOLDERS[1], label: 'Clips', icon: AudioLinesIcon },
  { id: FOLDERS[2], label: 'Move to stash', icon: FolderIcon },
];

export function StudioSoundsView() {
  const state = useStudioSoundsState();
  const { folder, setTabFolder, reload, loading, filtered } = state;

  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout mx-auto flex max-w-5xl flex-col gap-6 px-1 py-2">
        <StudioNav current="/studio/sounds" />
        <Tabs.Root
          selectedIndex={FOLDER_TABS.findIndex((entry) => entry.id === folder)}
          onChange={setTabFolder}
        >
          <Tabs.List>
            {FOLDER_TABS.map((folderOption) => (
              <Tabs.Tab key={folderOption.id}>
                <TabLabel icon={<folderOption.icon size={14} />}>
                  {folderOption.label}
                </TabLabel>
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.Root>
        <ViewShell title="Tracks" classes={{ root: 'px-0 pt-0' }}>
          {folder === 'sound' ? (
            <div className="mb-4">
              <AddToMusicActions onUploaded={reload} />
            </div>
          ) : null}

          {folder === 'files' ? (
            <StashFilesPanel />
          ) : (
            <StudioPanel>
              <SoundFilters state={state} />
              {loading ? (
                <PageLoading label="Loading…" />
              ) : filtered.length === 0 ? (
                <EmptyState
                  size="sm"
                  title="No tracks yet"
                  description="Upload a file or import from Sources."
                  action={
                    <AddToMusicActions align="center" onUploaded={reload} />
                  }
                />
              ) : (
                <ul className="divide-border divide-y">
                  {filtered.map((item) => (
                    <SoundRow key={item.id} item={item} state={state} />
                  ))}
                </ul>
              )}
            </StudioPanel>
          )}
        </ViewShell>
        <SoundsDialogs state={state} />
      </div>
    </StudioGate>
  );
}
