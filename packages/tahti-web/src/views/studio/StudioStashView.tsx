import { ArchiveIcon, FolderInputIcon, Lock } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Button,
  ButtonLink,
  EditIconButton,
  TabLabel,
  Tabs,
  ViewShell,
} from '@tahti-player/ui';

import { fetchStudioSounds } from '../../api/studio';
import type { StudioSound } from '../../api/studio-types';
import {
  PageEmpty,
  PageError,
  PageGate,
  PageLoading,
} from '../../components/PageStates';
import { StashFilesPanel } from '../../components/StashFilesPanel';
import { StudioGate } from '../../components/StudioGate';
import { StudioPanel } from '../../components/StudioPanel';
import { TrackEditDialog } from '../../components/TrackEditDialog';
import { hasStudioAccess } from '../../lib/accountRoles';
import { useAuthModalStore } from '../../stores/authModalStore';
import { useAuthStore } from '../../stores/authStore';
import { LibrarySectionTabs } from '../LibraryView';

function ListenerStash({ embedded }: { embedded: boolean }) {
  const { t } = useTranslation('web');
  return (
    <div className="studio-page-layout mx-auto flex max-w-4xl flex-col gap-6 px-1 py-2">
      {!embedded ? <LibrarySectionTabs active="stash" /> : null}
      {!embedded ? (
        <ViewShell
          title={t('studioStash.title')}
          classes={{ root: 'px-0 pt-0' }}
        >
          <StudioPanel
            title={t('studioStash.filesTitle')}
            description={t('studioStash.filesDescription')}
          >
            <StashFilesPanel filesOnly />
          </StudioPanel>
        </ViewShell>
      ) : (
        <StudioPanel
          title={t('studioStash.filesTitle')}
          description={t('studioStash.filesDescription')}
        >
          <StashFilesPanel filesOnly />
        </StudioPanel>
      )}
    </div>
  );
}

export function StudioStashView({ embedded = false }: { embedded?: boolean }) {
  const { t } = useTranslation('web');
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const profileLoaded = useAuthStore((s) => s.profileLoaded);
  const openAuth = useAuthModalStore((s) => s.open);
  const [tab, setTab] = useState<'all' | 'files'>('all');
  const [items, setItems] = useState<StudioSound[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (!hasStudioAccess(user)) {
      return;
    }
    setItemsLoading(true);
    void fetchStudioSounds().then((result) => {
      setLoadError(
        result.meta.source === 'api' ? (result.meta.reason ?? null) : null,
      );
      setItemsLoading(false);
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
  }, [user, attempt]);

  if (!hydrated) {
    return <PageLoading label={t('studioStash.loadingSession')} />;
  }

  if (!user) {
    return (
      <PageGate
        page={embedded ? null : t('studioStash.title')}
        icon={<Lock size={40} className="opacity-40" />}
        title={t('studioStash.title')}
        description={t('studioStash.gateDescription')}
        action={
          <Button onClick={() => openAuth('login')}>
            {t('actions.signIn')}
          </Button>
        }
      />
    );
  }

  if (!profileLoaded) {
    return <PageLoading label={t('studioStash.loadingAccount')} />;
  }

  if (!hasStudioAccess(user)) {
    return <ListenerStash embedded={embedded} />;
  }

  const tabs = (
    <Tabs.Root
      selectedIndex={tab === 'files' ? 1 : 0}
      onChange={(index) => setTab(index === 1 ? 'files' : 'all')}
    >
      <Tabs.List aria-label={t('studioStash.sectionsAria')}>
        <Tabs.Tab>
          <TabLabel icon={<ArchiveIcon size={14} />}>
            {t('studioStash.allStash')}
          </TabLabel>
        </Tabs.Tab>
        <Tabs.Tab>
          <TabLabel icon={<FolderInputIcon size={14} />}>
            {t('studioStash.moveToStash')}
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
        title={t('studioStash.tracksTitle')}
        description={t('studioStash.tracksDescription')}
      >
        {itemsLoading ? (
          <PageLoading label={t('studioStash.loading')} />
        ) : loadError && items.length === 0 ? (
          <PageError
            title={t('studioStash.loadError')}
            description={loadError}
            onRetry={() => setAttempt((n) => n + 1)}
          />
        ) : items.length === 0 ? (
          <PageEmpty
            title={t('studioStash.emptyTitle')}
            description={t('studioStash.emptyDescription')}
            className="mt-4"
            action={
              <ButtonLink to="/studio/upload" variant="secondary">
                {t('studioStash.uploadTrack')}
              </ButtonLink>
            }
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
                <EditIconButton
                  variant="text"
                  label={t('studioStashViewLabels.editTitle', {
                    title: item.title,
                  })}
                  onClick={() => setEditingId(item.id)}
                />
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
            <ViewShell
              title={t('studioStash.title')}
              classes={{ root: 'px-0 pt-0' }}
            >
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
