import { ArrowLeftIcon, ListMusicIcon, PlusIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import { Button, Dialog, Input, Tooltip } from '@tahti-player/ui';

import { fetchConnectionStatus } from '../api/sources/catalog';
import type { IntegrationId } from '../api/sources/catalog';
import { fetchSoundcloudPlaylists } from '../api/sources/soundcloud';
import { fetchMeProfile } from '../api/studio-extras';
import {
  fetchHearthisUserSets,
  LISTENER_WIDGET_TYPES,
  resolveHearthisPageEmbedUrl,
  resolveListenerWidgetInput,
  type ListenerWidgetType,
} from '../content/listenerWidgets';
import { isHttpUrl } from '../lib/parseRss';
import { useAuthStore } from '../stores/authStore';
import { useListenerWidgetsStore } from '../stores/listenerWidgetsStore';
import { ListenAddonsPanel } from './ListenAddonsPanel';
import { SourceServiceIcon } from './SourceServiceIcon';

type OwnPlaylist = { id: string; title: string; url: string; count: number };

const ICON_ID: Record<string, IntegrationId> = {
  soundcloud: 'soundcloud',
  spotify: 'spotify',
  hearthis: 'hearthis',
  bandcamp: 'bandcamp',
  mikseri: 'mikseri',
  youtube: 'url',
};

/** The signed-in listener's own playlists on a service, when Tahti can list
 * them: SoundCloud through the connected account, hearthis.at through the
 * handle on their profile. Other services take a pasted link only. */
async function loadOwnPlaylists(typeId: string): Promise<OwnPlaylist[]> {
  if (typeId === 'soundcloud') {
    const status = await fetchConnectionStatus('soundcloud');
    if (!status.data.connected) {
      return [];
    }
    const playlists = await fetchSoundcloudPlaylists();
    return playlists
      .filter((playlist) => playlist.permalinkUrl)
      .map((playlist) => ({
        id: playlist.id,
        title: playlist.title,
        url: playlist.permalinkUrl ?? '',
        count: playlist.trackCount,
      }));
  }
  if (typeId === 'hearthis') {
    const profile = await fetchMeProfile();
    const handle = profile.data.socialLinks?.hearthisAt ?? '';
    if (!handle) {
      return [];
    }
    const sets = await fetchHearthisUserSets(handle);
    return (sets ?? []).map((set) => ({
      id: set.id,
      title: set.title,
      url: set.pageUrl,
      count: set.trackCount,
    }));
  }
  return [];
}

/** Listen header: add a playlist from an outside service as its own Listen
 * row. Pick the service, then paste a playlist link (an example is shown)
 * or, when signed in, pick one of your own playlists on that service. */
export function AddListenWidgetDialog() {
  const { t } = useTranslation('web');
  const signedIn = useAuthStore((s) => Boolean(s.user));
  const addInstance = useListenerWidgetsStore((s) => s.addInstance);
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'services' | 'playlist' | 'addons'>(
    'services',
  );
  const [type, setType] = useState<ListenerWidgetType | null>(null);
  const [url, setUrl] = useState('');
  const [label, setLabel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [own, setOwn] = useState<OwnPlaylist[] | null>(null);

  useEffect(() => {
    if (!type || !signedIn) {
      setOwn(null);
      return;
    }
    let cancelled = false;
    setOwn(null);
    void loadOwnPlaylists(type.id)
      .catch(() => [])
      .then((list) => {
        if (!cancelled) {
          setOwn(list);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [type, signedIn]);

  const close = () => {
    setIsOpen(false);
    setView('services');
    setType(null);
    setUrl('');
    setLabel('');
    setError(null);
  };

  const pickService = (next: ListenerWidgetType) => {
    setType(next);
    setUrl('');
    setLabel('');
    setError(null);
    setView('playlist');
  };

  const add = async () => {
    if (!type) {
      return;
    }
    setAdding(true);
    setError(null);
    try {
      let resolved = resolveListenerWidgetInput(type.id, url);
      if (!resolved.ok && type.id === 'hearthis' && isHttpUrl(url.trim())) {
        const embedUrl = await resolveHearthisPageEmbedUrl(url.trim());
        if (embedUrl) {
          resolved = resolveListenerWidgetInput(type.id, embedUrl);
        }
      }
      if (!resolved.ok) {
        setError(resolved.error);
        return;
      }
      const name = label.trim() || type.name;
      addInstance(type.id, resolved.input, name);
      toast.success(t('addListenWidget.added', { name }));
      close();
    } finally {
      setAdding(false);
    }
  };

  return (
    <>
      <Tooltip content={t('addListenWidget.open')} side="top">
        <Button
          size="icon"
          variant="secondary"
          onClick={() => setIsOpen(true)}
          aria-label={t('addListenWidget.open')}
          data-testid="add-listen-widget"
        >
          <PlusIcon size={17} aria-hidden />
        </Button>
      </Tooltip>
      <Dialog.Root isOpen={isOpen} onClose={close} className="max-w-xl">
        {view === 'services' ? (
          <>
            <Dialog.Title>{t('addListenWidget.title')}</Dialog.Title>
            <Dialog.Description>
              {t('addListenWidget.chooseService')}
            </Dialog.Description>
            <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {LISTENER_WIDGET_TYPES.map((service) => (
                <li key={service.id}>
                  <Button
                    variant="secondary"
                    size="flexible"
                    className="flex w-full items-center gap-2 p-2 text-left"
                    onClick={() => pickService(service)}
                    data-testid={`add-listen-widget-service-${service.id}`}
                  >
                    <span className="size-8 shrink-0 overflow-hidden rounded">
                      <SourceServiceIcon id={ICON_ID[service.id] ?? 'url'} />
                    </span>
                    <span className="truncate text-sm font-semibold">
                      {service.name}
                    </span>
                  </Button>
                </li>
              ))}
            </ul>
            {signedIn ? (
              <Button
                variant="text"
                size="sm"
                className="mt-3"
                onClick={() => setView('addons')}
              >
                {t('addListenWidget.allAddons')}
              </Button>
            ) : null}
          </>
        ) : view === 'addons' ? (
          <>
            <Dialog.Title>{t('addListenWidget.allAddonsTitle')}</Dialog.Title>
            <Button
              variant="text"
              size="sm"
              className="self-start"
              onClick={() => setView('services')}
            >
              <ArrowLeftIcon size={14} aria-hidden />
              {t('addListenWidget.back')}
            </Button>
            <div className="mt-2 flex flex-col gap-3">
              <ListenAddonsPanel initialTab="available" compact />
            </div>
          </>
        ) : type ? (
          <>
            <Dialog.Title>
              {t('addListenWidget.fromService', { service: type.name })}
            </Dialog.Title>
            <Button
              variant="text"
              size="sm"
              className="self-start"
              onClick={() => setView('services')}
            >
              <ArrowLeftIcon size={14} aria-hidden />
              {t('addListenWidget.back')}
            </Button>
            <div className="mt-2 flex flex-col gap-3">
              <Input
                label={t('addListenWidget.playlistUrl')}
                placeholder={type.placeholder}
                value={url}
                onChange={(event) => {
                  setUrl(event.target.value);
                  setError(null);
                }}
                data-testid="add-listen-widget-url"
              />
              <p className="text-foreground-secondary text-xs">
                {t('addListenWidget.example', { example: type.placeholder })}
              </p>
              <Input
                label={t('addListenWidget.rowName')}
                placeholder={type.name}
                value={label}
                onChange={(event) => setLabel(event.target.value)}
              />
              {error ? (
                <p role="alert" className="text-accent-red text-sm">
                  {error}
                </p>
              ) : null}
              {own && own.length > 0 ? (
                <section className="flex flex-col gap-1">
                  <h3 className="text-foreground-secondary text-xs font-semibold tracking-wide uppercase">
                    {t('addListenWidget.yourPlaylists', {
                      service: type.name,
                    })}
                  </h3>
                  <ul
                    className="flex max-h-56 flex-col gap-1 overflow-y-auto"
                    data-testid="add-listen-widget-own"
                  >
                    {own.map((playlist) => (
                      <li key={playlist.id}>
                        <Button
                          variant="text"
                          size="flexible"
                          aria-pressed={url === playlist.url}
                          className="aria-pressed:bg-background-secondary flex w-full items-center gap-2 px-2 py-1.5 text-left"
                          onClick={() => {
                            setUrl(playlist.url);
                            setLabel(playlist.title);
                            setError(null);
                          }}
                        >
                          <ListMusicIcon size={16} aria-hidden />
                          <span className="min-w-0 flex-1 truncate text-sm">
                            {playlist.title}
                          </span>
                          <span className="text-foreground-secondary text-xs">
                            {t('addListenWidget.trackCount', {
                              count: playlist.count,
                            })}
                          </span>
                        </Button>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={close}>
                  {t('actions.cancel')}
                </Button>
                <Button
                  onClick={() => void add()}
                  disabled={adding || !url.trim()}
                  data-testid="add-listen-widget-submit"
                >
                  <PlusIcon size={16} aria-hidden />
                  {t('addListenWidget.add')}
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </Dialog.Root>
    </>
  );
}
