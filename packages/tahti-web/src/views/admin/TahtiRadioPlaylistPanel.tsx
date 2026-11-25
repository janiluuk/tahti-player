import { PlayIcon, PlusIcon, RadioTowerIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, Checkbox, Dialog, FilterBar, Tooltip } from '@tahti-player/ui';

import {
  addToRadioRotation,
  fetchAdminRadioRotation,
  removeFromRadioRotation,
  reorderRadioRotation,
  searchAdminRadioBrowse,
  type AdminRadioBrowseItem,
  type AdminRadioRotationItem,
} from '../../api/admin';
import {
  fetchRadioRecentlyPlayed,
  fetchRadioStation,
  type RadioRecentlyPlayedItem,
} from '../../api/client';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { PageEmpty, PageError, PageLoading } from '../../components/PageStates';
import { StudioPanel } from '../../components/StudioPanel';
import { TahtiRotationPlaylistEditor } from '../../components/TahtiRotationPlaylistEditor';
import { findOnAirRotationItemId } from '../../lib/radioRotationOnAir';
import { webT } from '../../lib/webT';
import { usePlayerStore } from '../../stores/playerStore';

function fmtDuration(sec: number | null): string {
  if (!sec) {
    return '—';
  }
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function TahtiRadioPlaylistPanel() {
  const { t } = useTranslation('web');
  const play = usePlayerStore((s) => s.play);
  const [items, setItems] = useState<AdminRadioRotationItem[]>([]);
  const [nowPlayingTitle, setNowPlayingTitle] = useState<string | null>(null);
  const [latestPlay, setLatestPlay] = useState<RadioRecentlyPlayedItem | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [browse, setBrowse] = useState<AdminRadioBrowseItem[]>([]);
  const [browseError, setBrowseError] = useState<string | null>(null);
  const [browseAttempt, setBrowseAttempt] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selected, setSelected] = useState<Map<string, AdminRadioBrowseItem>>(
    new Map(),
  );
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pendingRemove, setPendingRemove] =
    useState<AdminRadioRotationItem | null>(null);

  const reload = useCallback(() => {
    void Promise.all([
      fetchAdminRadioRotation(),
      fetchRadioStation(),
      fetchRadioRecentlyPlayed(),
    ]).then(([rotationResult, stationResult, recentResult]) => {
      setItems(rotationResult.data);
      setLoadError(
        rotationResult.meta.source === 'api'
          ? (rotationResult.meta.reason ?? null)
          : null,
      );
      setNowPlayingTitle(stationResult.data.nowPlaying?.title ?? null);
      setLatestPlay(recentResult.data[0] ?? null);
      setLoading(false);
    });
  }, []);

  useEffect(reload, [reload]);

  useEffect(() => {
    if (!pickerOpen) {
      setBrowse([]);
      setBrowseError(null);
      return;
    }
    let cancelled = false;
    const handle = setTimeout(() => {
      void searchAdminRadioBrowse(query).then((res) => {
        if (cancelled) {
          return;
        }
        setBrowse(res.data);
        setBrowseError(
          res.meta.source === 'api' ? (res.meta.reason ?? null) : null,
        );
      });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [pickerOpen, query, browseAttempt]);

  const inRotationIds = new Set(items.map((i) => i.soundId));
  const selectable = browse.filter((item) => !inRotationIds.has(item.id));
  const allShownSelected =
    selectable.length > 0 && selectable.every((item) => selected.has(item.id));

  const closePicker = () => {
    if (adding) {
      return;
    }
    setPickerOpen(false);
    setSelected(new Map());
    setQuery('');
  };

  const toggleSelected = (item: AdminRadioBrowseItem) =>
    setSelected((current) => {
      const next = new Map(current);
      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        next.set(item.id, item);
      }
      return next;
    });

  const toggleAllShown = () =>
    setSelected((current) => {
      const next = new Map(current);
      for (const item of selectable) {
        if (allShownSelected) {
          next.delete(item.id);
        } else {
          next.set(item.id, item);
        }
      }
      return next;
    });

  const addSelected = () => {
    const chosen = [...selected.values()];
    setAdding(true);
    setMsg(null);
    void Promise.all(
      chosen.map((item) =>
        addToRadioRotation(item).then((result) => ({ item, result })),
      ),
    ).then((outcomes) => {
      setAdding(false);
      const failed = outcomes.filter((outcome) => !outcome.result.ok);
      const added = outcomes.length - failed.length;
      if (added > 0) {
        reload();
      }
      if (failed.length > 0) {
        const first = failed[0]?.result;
        setSelected(new Map(failed.map(({ item }) => [item.id, item])));
        setMsg(
          t('tahtiRadioPlaylistPanel.addedSome', {
            added,
            total: outcomes.length,
            error: first && !first.ok ? first.error : '',
          }),
        );
        return;
      }
      setPickerOpen(false);
      setSelected(new Map());
      setQuery('');
      setMsg(t('tahtiRadioPlaylistPanel.addedTracks', { count: added }));
    });
  };
  const nowPlayingId = findOnAirRotationItemId(
    items,
    nowPlayingTitle == null ? null : { title: nowPlayingTitle },
    latestPlay,
  );

  return (
    <div className="flex flex-col gap-4">
      <p className="text-foreground-secondary text-sm">
        {t('tahtiRadioPlaylistPanel.curatedRotationDescription')}
      </p>

      {msg ? (
        <p className="text-foreground-secondary text-sm" role="status">
          {msg}
        </p>
      ) : null}

      <StudioPanel
        title={t('tahtiRadioPlaylistPanelLabels.currentRotationLength', {
          length: items.length,
        })}
        description={
          nowPlayingTitle
            ? t('tahtiRadioPlaylistPanel.nowPlayingTrack', {
                title: nowPlayingTitle,
              })
            : t('tahtiRadioPlaylistPanel.dragTracksDescription')
        }
        action={
          <Button
            size="sm"
            onClick={() => {
              setMsg(null);
              setPickerOpen(true);
            }}
            disabled={busy || adding}
          >
            <PlusIcon size={16} aria-hidden className="mr-1.5" />
            {t('tahtiRadioPlaylistPanel.addTracks')}
          </Button>
        }
      >
        {loading ? (
          <PageLoading label={t('loading.loadingRadioPlaylist')} />
        ) : loadError ? (
          <PageError
            title={t('loadErrors.couldNotLoadRadioPlaylist')}
            description={loadError}
            onRetry={() => {
              setLoading(true);
              reload();
            }}
          />
        ) : items.length === 0 ? (
          <PageEmpty
            title={t('empties.adminRadioNoRotation')}
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setPickerOpen(true)}
              >
                <PlusIcon size={16} aria-hidden className="mr-1.5" />
                {t('tahtiRadioPlaylistPanel.addTracks')}
              </Button>
            }
          />
        ) : (
          <TahtiRotationPlaylistEditor
            items={items}
            busy={busy}
            nowPlayingItemId={nowPlayingId}
            onPreview={(item) => {
              if (!item.audioUrl) {
                return;
              }
              play({
                id: `sound:${item.soundId}`,
                kind: 'sound',
                title: item.title,
                artist: item.artistName,
                streamUrl: item.audioUrl,
                protocol: item.audioUrl.includes('.m3u8') ? 'hls' : 'https',
                channelSlug: item.channelSlug,
              });
            }}
            onReorder={(next) => {
              const previous = items;
              setItems(next);
              setBusy(true);
              void reorderRadioRotation(next.map((item) => item.id)).then(
                (result) => {
                  setBusy(false);
                  if (!result.ok) {
                    setItems(previous);
                    setMsg(result.error);
                    reload();
                  }
                },
              );
            }}
            onRemove={(item) => setPendingRemove(item)}
          />
        )}
      </StudioPanel>

      <ConfirmDialog
        isOpen={pendingRemove !== null}
        onCancel={() => setPendingRemove(null)}
        title={t('tahtiRadioPlaylistPanel.removeTrackTitle')}
        description={
          pendingRemove
            ? t('tahtiRadioPlaylistPanel.removeTrackDescription', {
                title: pendingRemove.title,
              })
            : ''
        }
        confirmLabel={t('tahtiRadioPlaylistPanel.removeTrackConfirm')}
        destructive
        onConfirm={() => {
          const item = pendingRemove;
          setPendingRemove(null);
          if (!item) {
            return;
          }
          setBusy(true);
          void removeFromRadioRotation(item.id).then((result) => {
            setBusy(false);
            if (!result.ok) {
              setMsg(result.error);
              return;
            }
            reload();
          });
        }}
      />

      <Dialog.Root
        isOpen={pickerOpen}
        onClose={closePicker}
        className="flex max-w-4xl flex-col overflow-hidden p-4 sm:p-6"
      >
        <Dialog.Title>
          {t('tahtiRadioPlaylistPanel.addTracksTitle')}
        </Dialog.Title>
        <Dialog.Description>
          {t('tahtiRadioPlaylistPanel.addTracksDescription')}
        </Dialog.Description>
        <div className="mt-4 flex min-h-0 flex-1 flex-col gap-4 md:grid md:min-h-96 md:grid-cols-[12rem_minmax(0,1fr)]">
          <nav
            aria-label={t('tahtiRadioPlaylistPanel.contentTypes')}
            className="border-border hidden md:flex md:flex-col md:border-r md:pr-3"
          >
            <Button
              variant="tertiary"
              className="justify-start"
              aria-current="page"
            >
              <RadioTowerIcon size={15} aria-hidden className="mr-2" />
              {t('tahtiRadioPlaylistPanel.tracks')}
            </Button>
          </nav>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
            <FilterBar
              searchValue={query}
              onSearchChange={setQuery}
              searchLabel={t('tahtiRadioPlaylistPanel.searchContent')}
              searchPlaceholder={t(
                'tahtiRadioPlaylistPanel.searchTracksByTitle',
              )}
            />
            {selectable.length > 0 ? (
              <div className="flex items-center justify-between gap-3 text-sm">
                <Checkbox
                  label={t('tahtiRadioPlaylistPanel.selectAllShown')}
                  checked={allShownSelected}
                  onChange={toggleAllShown}
                />
                <span className="text-foreground-secondary" role="status">
                  {t('tahtiRadioPlaylistPanel.selectedCount', {
                    count: selected.size,
                  })}
                </span>
              </div>
            ) : null}
            <div className="border-border min-h-0 flex-1 overflow-auto rounded-md border">
              {browseError ? (
                <PageError
                  title={t('loadErrors.couldnTLoadArchiveTracks')}
                  description={browseError}
                  onRetry={() => setBrowseAttempt((n) => n + 1)}
                />
              ) : browse.length === 0 ? (
                <PageEmpty
                  title={
                    query.trim()
                      ? t('tahtiRadioPlaylistPanel.noTracksMatch', {
                          query,
                        })
                      : t('tahtiRadioPlaylistPanel.noEligibleTracks')
                  }
                />
              ) : (
                <ul
                  aria-label={t('tahtiRadioPlaylistPanel.availableTracks')}
                  className="divide-border divide-y"
                >
                  {browse.map((item, index) => {
                    const already = inRotationIds.has(item.id);
                    return (
                      <li
                        key={item.id}
                        className={`flex items-center gap-2 px-3 py-2.5 text-sm sm:gap-3 ${index % 2 === 1 ? 'bg-background-secondary/40' : 'bg-background'}`}
                      >
                        <Checkbox
                          checked={already || selected.has(item.id)}
                          disabled={already}
                          aria-label={
                            selected.has(item.id)
                              ? t('selectsTabStates.deselectItem', {
                                  title: item.title,
                                })
                              : t('selectsTabStates.selectItem', {
                                  title: item.title,
                                })
                          }
                          onChange={() => toggleSelected(item)}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">
                            {item.title}
                          </div>
                          <div className="text-foreground-secondary truncate text-xs">
                            {item.artistName} · {fmtDuration(item.durationSec)}{' '}
                            · {item.license}
                          </div>
                        </div>
                        {item.audioUrl ? (
                          <Tooltip
                            content={t('selectsTabLabels.previewTitle', {
                              title: item.title,
                            })}
                            side="top"
                          >
                            <Button
                              size="icon-sm"
                              variant="text"
                              aria-label={t('selectsTabLabels.previewTitle', {
                                title: item.title,
                              })}
                              onClick={() =>
                                play({
                                  id: `sound:${item.id}`,
                                  kind: 'sound',
                                  title: item.title,
                                  artist: item.artistName,
                                  streamUrl: item.audioUrl!,
                                  protocol: 'https',
                                  channelSlug: item.channelSlug,
                                })
                              }
                            >
                              <PlayIcon size={16} aria-hidden />
                            </Button>
                          </Tooltip>
                        ) : null}
                        {already ? (
                          <span className="text-foreground-secondary shrink-0 text-right text-xs sm:w-20">
                            {t('selectsTabLeftovers.inRotation')}
                          </span>
                        ) : (
                          <span className="text-foreground-secondary hidden w-20 shrink-0 text-right text-xs sm:inline">
                            {selected.has(item.id)
                              ? t('selectsTabLeftovers.selected')
                              : ''}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
        <Dialog.Actions>
          <Button variant="secondary" disabled={adding} onClick={closePicker}>
            {t('selectsTab.cancel')}
          </Button>
          <Button
            disabled={selected.size === 0 || adding}
            onClick={addSelected}
          >
            {adding
              ? t('tahtiRadioPlaylistPanel.adding')
              : webT()('a11yNamed.addNToRotation', {
                  n: selected.size || '',
                })}
          </Button>
        </Dialog.Actions>
      </Dialog.Root>
    </div>
  );
}
