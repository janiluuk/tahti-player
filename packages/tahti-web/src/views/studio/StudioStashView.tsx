import { ArchiveIcon, FolderInputIcon, Lock, PencilIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  Button,
  EmptyState,
  TabLabel,
  Tabs,
  Tooltip,
  ViewShell,
} from '@tahti-player/ui';

import { fetchStudioSounds } from '../../api/studio';
import type { StudioSound } from '../../api/studio-types';
import { PageGate, PageLoading } from '../../components/PageStates';
import { StashFilesPanel } from '../../components/StashFilesPanel';
import { StudioGate } from '../../components/StudioGate';
import { StudioPanel } from '../../components/StudioPanel';
import { TrackEditDialog } from '../../components/TrackEditDialog';
import { hasStudioAccess } from '../../lib/accountRoles';
import { useAuthModalStore } from '../../stores/authModalStore';
import { useAuthStore } from '../../stores/authStore';
import { LibrarySectionTabs } from '../LibraryView';

function ListenerStash({ embedded }: { embedded: boolean }) {
  return (
    <div className="studio-page-layout mx-auto flex max-w-4xl flex-col gap-6 px-1 py-2">
      {!embedded ? <LibrarySectionTabs active="stash" /> : null}
      {!embedded ? (
        <ViewShell title="Stash" classes={{ root: 'px-0 pt-0' }}>
          <StudioPanel
            title="Your files"
            description="Private uploads you can share by link. Publishing tracks needs an artist channel."
          >
            <StashFilesPanel filesOnly />
          </StudioPanel>
        </ViewShell>
      ) : (
        <StudioPanel
          title="Your files"
          description="Private uploads you can share by link. Publishing tracks needs an artist channel."
        >
          <StashFilesPanel filesOnly />
        </StudioPanel>
      )}
    </div>
  );
}

export function StudioStashView({ embedded = false }: { embedded?: boolean }) {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const profileLoaded = useAuthStore((s) => s.profileLoaded);
  const openAuth = useAuthModalStore((s) => s.open);
  const [tab, setTab] = useState<'all' | 'files'>('all');
  const [items, setItems] = useState<StudioSound[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (!hasStudioAccess(user)) {
      return;
    }
    void fetchStudioSounds().then((result) => {
      setItems(
        result.data.filter(
          (item) =>
            item.visibility === 'STASH' ||
            item.visibility === 'PRIVATE' ||
            item.visibility === 'UNLISTED' ||
            item.isPublic === false,
        ),
      );
    });
  }, [user]);

  if (!hydrated) {
    return <PageLoading label="Loading session…" />;
  }

  if (!user) {
    return (
      <PageGate
        page={embedded ? null : 'Stash'}
        icon={<Lock size={40} className="opacity-40" />}
        title="Stash"
        description="Sign in to upload private files and share them by link."
        action={<Button onClick={() => openAuth('login')}>Log in</Button>}
      />
    );
  }

  if (!profileLoaded) {
    return <PageLoading label="Loading your account…" />;
  }

  if (!hasStudioAccess(user)) {
    return <ListenerStash embedded={embedded} />;
  }

  const tabs = (
    <Tabs.Root
      selectedIndex={tab === 'files' ? 1 : 0}
      onChange={(index) => setTab(index === 1 ? 'files' : 'all')}
    >
      <Tabs.List aria-label="Stash sections">
        <Tabs.Tab>
          <TabLabel icon={<ArchiveIcon size={14} />}>All stash</TabLabel>
        </Tabs.Tab>
        <Tabs.Tab>
          <TabLabel icon={<FolderInputIcon size={14} />}>
            Move to stash
          </TabLabel>
        </Tabs.Tab>
      </Tabs.List>
    </Tabs.Root>
  );

  const content =
    tab === 'files' ? (
      <StashFilesPanel />
    ) : (
      <StudioPanel
        title="Stash tracks"
        description="Edit these items like any other track. They stay out of public listings."
      >
        {items.length === 0 ? (
          <EmptyState
            size="sm"
            title="No tracks in your stash yet"
            className="mt-4"
          />
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="border-border flex items-center gap-3 rounded-lg border px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <p className="text-foreground-secondary text-xs">
                    {item.contentType ?? 'Track'} · {item.status}
                  </p>
                </div>
                <Tooltip content="Edit track" side="top">
                  <Button
                    size="icon-sm"
                    variant="text"
                    aria-label={`Edit ${item.title}`}
                    onClick={() => setEditingId(item.id)}
                  >
                    <PencilIcon size={14} aria-hidden />
                  </Button>
                </Tooltip>
              </li>
            ))}
          </ul>
        )}
      </StudioPanel>
    );

  return (
    <StudioGate requireChannel={false} embedded={embedded}>
      <div className="studio-page-layout mx-auto flex max-w-4xl flex-col gap-6 px-1 py-2">
        {!embedded ? <LibrarySectionTabs active="stash" /> : null}
        {!embedded ? (
          <>
            {tabs}
            <ViewShell title="Stash" classes={{ root: 'px-0 pt-0' }}>
              {content}
            </ViewShell>
          </>
        ) : (
          <>
            {tabs}
            {content}
          </>
        )}
        <TrackEditDialog
          soundId={editingId}
          onClose={() => setEditingId(null)}
          onSaved={(saved) =>
            setItems((current) =>
              current.map((item) => (item.id === saved.id ? saved : item)),
            )
          }
        />
      </div>
    </StudioGate>
  );
}
