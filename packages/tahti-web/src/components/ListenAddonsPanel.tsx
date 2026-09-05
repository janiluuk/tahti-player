import { Heart, Newspaper, SettingsIcon, Youtube } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

import {
  Box,
  Button,
  Dialog,
  Input,
  PluginStoreItem,
  TabLabel,
  Tabs,
  Toggle,
  Tooltip,
} from '@tahti-player/ui';

import { fetchMeProfile, patchMeProfile } from '../api/studio-extras';
import {
  fetchHearthisUserSets,
  LISTENER_WIDGET_TYPES,
  resolveHearthisPageEmbedUrl,
  resolveListenerWidgetInput,
  soundcloudProfileUrl,
  type HearthisSet,
} from '../content/listenerWidgets';
import { cn } from '../lib/cn';
import { isHttpUrl } from '../lib/parseRss';
import {
  NEWS_WIDGET_TYPE_ID,
  useListenerWidgetsStore,
  type ListenerWidgetSurface,
} from '../stores/listenerWidgetsStore';
import { ImageUploadField } from './ImageUploadField';
import { ListenerWidgetEmbed } from './ListenerWidgetEmbed';
import { NewsFeedWidget } from './NewsFeedWidget';
import { SourceServiceIcon } from './SourceServiceIcon';

function ConfigurableCard({
  header,
  children,
  title,
  open,
  onOpenChange,
  className,
  asModal = false,
}: {
  header: ReactNode | ((open: () => void) => ReactNode);
  children: ReactNode;
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
  /** Show the config panel in a Dialog instead of expanding inline — for
   * configs too tall/rich to sit comfortably inside the addon list. */
  asModal?: boolean;
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          {typeof header === 'function'
            ? header(() => onOpenChange(true))
            : header}
        </div>
        <Tooltip
          content={open ? `Hide ${title} configuration` : `Configure ${title}`}
          side="top"
        >
          <Button
            size="icon-sm"
            variant="secondary"
            onClick={() => onOpenChange(!open)}
            aria-label={
              open ? `Hide ${title} configuration` : `Configure ${title}`
            }
          >
            <SettingsIcon size={15} aria-hidden />
          </Button>
        </Tooltip>
      </div>
      {asModal ? (
        <Dialog.Root
          isOpen={open}
          onClose={() => onOpenChange(false)}
          className="max-w-lg"
        >
          <Dialog.Title>{title} configuration</Dialog.Title>
          <div
            className="mt-4 flex flex-col gap-4"
            data-testid={`listen-addon-config-${title}`}
          >
            {children}
          </div>
        </Dialog.Root>
      ) : open ? (
        <Box
          variant="tertiary"
          shadow="none"
          className="gap-4 p-3"
          data-testid={`listen-addon-config-${title}`}
        >
          {children}
        </Box>
      ) : null}
    </div>
  );
}

function listenAddonIcon(typeId: string): ReactNode {
  if (typeId === 'favorites') {
    return <Heart className="size-6" aria-hidden />;
  }
  if (typeId === NEWS_WIDGET_TYPE_ID) {
    return <Newspaper className="size-6" aria-hidden />;
  }
  if (typeId === 'youtube') {
    return <Youtube className="size-6" aria-hidden />;
  }
  if (
    typeId === 'soundcloud' ||
    typeId === 'spotify' ||
    typeId === 'hearthis' ||
    typeId === 'bandcamp'
  ) {
    return <SourceServiceIcon id={typeId} />;
  }
  return undefined;
}

export function ListenAddonsPanel({
  initialTab = 'installed',
  compact = false,
}: {
  initialTab?: 'installed' | 'available';
  compact?: boolean;
}) {
  const [installTab, setInstallTab] = useState<'installed' | 'available'>(
    initialTab,
  );
  const [configuringId, setConfiguringId] = useState<string | null>(null);
  const installedTypeIds = useListenerWidgetsStore((s) => s.installedTypeIds);
  const instances = useListenerWidgetsStore((s) => s.instances);
  const installType = useListenerWidgetsStore((s) => s.installType);
  const uninstallType = useListenerWidgetsStore((s) => s.uninstallType);
  const addInstance = useListenerWidgetsStore((s) => s.addInstance);
  const removeInstance = useListenerWidgetsStore((s) => s.removeInstance);
  const [inputByType, setInputByType] = useState<Record<string, string>>({});
  const [errorByType, setErrorByType] = useState<Record<string, string>>({});
  const [soundcloudProfile, setSoundcloudProfile] = useState('');
  const [soundcloudProfileLoading, setSoundcloudProfileLoading] =
    useState(true);
  const [savingSoundcloudProfile, setSavingSoundcloudProfile] = useState(false);
  const [newsTitle, setNewsTitle] = useState('News');
  const [newsFeedUrl, setNewsFeedUrl] = useState('');
  const [newsThumbnailUrl, setNewsThumbnailUrl] = useState('');
  const [newsShowListen, setNewsShowListen] = useState(true);
  const [newsShowDiscover, setNewsShowDiscover] = useState(true);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [resolvingHearthisUrl, setResolvingHearthisUrl] = useState(false);
  const [hearthisUsername, setHearthisUsername] = useState('');
  const [hearthisSets, setHearthisSets] = useState<HearthisSet[] | null>(null);
  const [hearthisSetsLoading, setHearthisSetsLoading] = useState(false);
  const [hearthisSetsError, setHearthisSetsError] = useState<string | null>(
    null,
  );
  const [addingHearthisSetId, setAddingHearthisSetId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    void fetchMeProfile()
      .then((profile) => {
        const accountLink = profile.data.socialLinks?.soundcloud ?? '';
        setSoundcloudProfile(soundcloudProfileUrl(accountLink) ?? accountLink);
      })
      .catch(() => undefined)
      .finally(() => {
        setSoundcloudProfileLoading(false);
      });
  }, []);

  const handleInstall = (typeId: string) => {
    installType(typeId);
    setInstallTab('installed');
    setConfiguringId(typeId);
  };

  const handleUninstall = (typeId: string) => {
    uninstallType(typeId);
    setConfiguringId((current) => (current === typeId ? null : current));
    setErrorByType((prev) => {
      const next = { ...prev };
      delete next[typeId];
      return next;
    });
  };

  const addWidgetInstance = async (typeId: string, label: string) => {
    const rawInput =
      inputByType[typeId] ?? (typeId === 'soundcloud' ? soundcloudProfile : '');
    let resolved = resolveListenerWidgetInput(typeId, rawInput);
    if (!resolved.ok && typeId === 'hearthis' && isHttpUrl(rawInput.trim())) {
      // A plain hearthis.at track/set page URL (not an /embed/ link) — ask
      // hearthis.at's own oEmbed endpoint for the real embed src rather
      // than rejecting it; set embeds carry a token that can't be guessed.
      setResolvingHearthisUrl(true);
      const embedUrl = await resolveHearthisPageEmbedUrl(rawInput.trim());
      setResolvingHearthisUrl(false);
      if (embedUrl) {
        resolved = resolveListenerWidgetInput(typeId, embedUrl);
      }
    }
    if (!resolved.ok) {
      setErrorByType((prev) => ({ ...prev, [typeId]: resolved.error }));
      return;
    }

    if (resolved.saveSoundcloudProfile) {
      setSavingSoundcloudProfile(true);
      setErrorByType((prev) => {
        const next = { ...prev };
        delete next.soundcloud;
        return next;
      });
      try {
        const profile = await fetchMeProfile();
        const saved = await patchMeProfile({
          socialLinks: {
            ...(profile.data.socialLinks ?? {}),
            soundcloud: resolved.input,
          },
        });
        if (!saved.ok) {
          setErrorByType((prev) => ({ ...prev, soundcloud: saved.error }));
          return;
        }
        setSoundcloudProfile(resolved.input);
      } catch {
        setErrorByType((prev) => ({
          ...prev,
          soundcloud: 'Could not save your SoundCloud profile. Try again.',
        }));
        return;
      } finally {
        setSavingSoundcloudProfile(false);
      }
    }

    addInstance(typeId, resolved.input, label);
    setInputByType((prev) => ({
      ...prev,
      [typeId]: typeId === 'soundcloud' ? resolved.input : '',
    }));
    setErrorByType((prev) => {
      const next = { ...prev };
      delete next[typeId];
      return next;
    });
  };

  const loadHearthisSets = async () => {
    const handle = hearthisUsername.trim();
    if (!handle) {
      setHearthisSetsError('Enter your hearthis.at username.');
      return;
    }
    setHearthisSetsLoading(true);
    setHearthisSetsError(null);
    const sets = await fetchHearthisUserSets(handle);
    setHearthisSetsLoading(false);
    if (!sets) {
      setHearthisSetsError(
        "Couldn't load sets for that username. Check the spelling and try again.",
      );
      setHearthisSets(null);
      return;
    }
    if (sets.length === 0) {
      setHearthisSetsError("This account doesn't have any public sets.");
    }
    setHearthisSets(sets);
  };

  const addHearthisSet = async (set: HearthisSet) => {
    setAddingHearthisSetId(set.id);
    const embedUrl = await resolveHearthisPageEmbedUrl(set.pageUrl);
    setAddingHearthisSetId(null);
    if (!embedUrl) {
      setHearthisSetsError(`Couldn't resolve an embed for "${set.title}".`);
      return;
    }
    addInstance('hearthis', embedUrl, set.title);
  };

  const addNewsFeed = () => {
    const url = newsFeedUrl.trim();
    if (!isHttpUrl(url)) {
      setNewsError('Paste an http(s) RSS or Atom feed URL.');
      return;
    }
    if (!newsShowListen && !newsShowDiscover) {
      setNewsError('Show this feed on Listen, Discover, or both.');
      return;
    }
    const surfaces: ListenerWidgetSurface[] = [
      ...(newsShowListen ? (['listen'] as const) : []),
      ...(newsShowDiscover ? (['discover'] as const) : []),
    ];
    addInstance(NEWS_WIDGET_TYPE_ID, url, newsTitle.trim() || 'News', {
      thumbnailUrl: newsThumbnailUrl.trim() || undefined,
      surfaces,
    });
    setNewsFeedUrl('');
    setNewsError(null);
  };

  const favoritesInstalled = installedTypeIds.includes('favorites');
  const newsInstalled = installedTypeIds.includes(NEWS_WIDGET_TYPE_ID);
  const newsInstances = instances.filter(
    (instance) => instance.typeId === NEWS_WIDGET_TYPE_ID,
  );
  const extraInstalled = (favoritesInstalled ? 1 : 0) + (newsInstalled ? 1 : 0);
  const installedCount =
    extraInstalled +
    LISTENER_WIDGET_TYPES.filter((type) => installedTypeIds.includes(type.id))
      .length;
  const availableCount = LISTENER_WIDGET_TYPES.length + 2 - installedCount;
  const listClassName = compact
    ? 'flex flex-col gap-1.5'
    : 'flex flex-col gap-3';

  return (
    <div className="flex flex-col gap-3">
      <Tabs.Root
        selectedIndex={installTab === 'installed' ? 0 : 1}
        onChange={(index) =>
          setInstallTab(index === 0 ? 'installed' : 'available')
        }
      >
        <Tabs.List>
          <Tabs.Tab>
            <TabLabel count={installedCount}>Installed</TabLabel>
          </Tabs.Tab>
          <Tabs.Tab>
            <TabLabel count={availableCount}>Available</TabLabel>
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.Root>
      <div className={listClassName}>
        {favoritesInstalled === (installTab === 'installed') && (
          <ConfigurableCard
            title="Favorites"
            open={configuringId === 'favorites'}
            onOpenChange={(open) => setConfiguringId(open ? 'favorites' : null)}
            header={
              <PluginStoreItem
                icon={listenAddonIcon('favorites')}
                name="Favorites"
                author="Tahti"
                description="Show your favorite channels and tracks as a section on Listen."
                category="Listen"
                isInstalled={favoritesInstalled}
                onInstall={() => handleInstall('favorites')}
                compact={compact}
              />
            }
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-foreground-secondary text-sm">
                Enabled favorites appear on the Listen page.
              </p>
              <Button
                size="sm"
                variant="text"
                onClick={() => handleUninstall('favorites')}
              >
                Uninstall
              </Button>
            </div>
          </ConfigurableCard>
        )}
        {newsInstalled === (installTab === 'installed') && (
          <ConfigurableCard
            title="News"
            open={configuringId === NEWS_WIDGET_TYPE_ID}
            onOpenChange={(open) =>
              setConfiguringId(open ? NEWS_WIDGET_TYPE_ID : null)
            }
            header={
              <PluginStoreItem
                icon={listenAddonIcon(NEWS_WIDGET_TYPE_ID)}
                name="News"
                author="Tahti"
                description="Show an RSS or Atom article slider on Listen and Discover. Configure a thumbnail and feed URL."
                category="Listen"
                isInstalled={newsInstalled}
                onInstall={() => handleInstall(NEWS_WIDGET_TYPE_ID)}
                compact={compact}
              />
            }
          >
            {newsInstalled ? (
              <div className="flex flex-col gap-3">
                {newsInstances.map((instance) => (
                  <NewsFeedWidget
                    key={instance.id}
                    instance={instance}
                    onRemove={() => removeInstance(instance.id)}
                  />
                ))}
                <form
                  className="flex flex-col gap-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    addNewsFeed();
                  }}
                >
                  <Input
                    label="Title"
                    value={newsTitle}
                    onChange={(event) => setNewsTitle(event.target.value)}
                    placeholder="News"
                  />
                  <Input
                    label="RSS feed URL"
                    value={newsFeedUrl}
                    onChange={(event) => {
                      setNewsError(null);
                      setNewsFeedUrl(event.target.value);
                    }}
                    placeholder="https://example.com/feed.xml"
                    required
                  />
                  <ImageUploadField
                    label="Thumbnail"
                    description="Used next to the title and when an article has no image."
                    value={newsThumbnailUrl}
                    onChange={setNewsThumbnailUrl}
                  />
                  <div className="flex flex-wrap gap-6">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span>Show on Listen</span>
                      <Toggle
                        label="Show on Listen"
                        checked={newsShowListen}
                        onChange={setNewsShowListen}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span>Show on Discover</span>
                      <Toggle
                        label="Show on Discover"
                        checked={newsShowDiscover}
                        onChange={setNewsShowDiscover}
                      />
                    </div>
                  </div>
                  <Button size="sm" type="submit" className="self-start">
                    Add feed
                  </Button>
                </form>
                {newsError ? (
                  <p className="text-destructive text-xs" role="alert">
                    {newsError}
                  </p>
                ) : null}
                <div className="flex items-center justify-between">
                  <p className="text-foreground-secondary text-xs">
                    Paste a public RSS 2.0 or Atom URL. Articles open in a new
                    tab.
                  </p>
                  <Button
                    size="sm"
                    variant="text"
                    onClick={() => handleUninstall(NEWS_WIDGET_TYPE_ID)}
                  >
                    Uninstall
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-foreground-secondary text-sm">
                Install this add-on to add RSS feeds to Listen and Discover.
              </p>
            )}
          </ConfigurableCard>
        )}
        {LISTENER_WIDGET_TYPES.filter(
          (type) =>
            installedTypeIds.includes(type.id) === (installTab === 'installed'),
        ).map((type) => {
          const isInstalled = installedTypeIds.includes(type.id);
          const typeInstances = instances.filter((i) => i.typeId === type.id);
          return (
            <ConfigurableCard
              key={type.id}
              title={type.name}
              open={configuringId === type.id}
              onOpenChange={(open) => setConfiguringId(open ? type.id : null)}
              asModal={type.id === 'hearthis'}
              header={
                <PluginStoreItem
                  icon={listenAddonIcon(type.id)}
                  name={type.name}
                  author={type.author}
                  description={type.description}
                  category={type.category}
                  isInstalled={isInstalled}
                  onInstall={() => handleInstall(type.id)}
                  compact={compact}
                />
              }
            >
              {isInstalled ? (
                <div className="flex flex-col gap-3">
                  {typeInstances.map((instance) => (
                    <ListenerWidgetEmbed
                      key={instance.id}
                      instance={instance}
                      onRemove={() => removeInstance(instance.id)}
                    />
                  ))}
                  <form
                    className="flex flex-wrap items-end gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void addWidgetInstance(type.id, type.name);
                    }}
                  >
                    <Input
                      label={`Add a ${type.name} link`}
                      value={
                        inputByType[type.id] ??
                        (type.id === 'soundcloud' ? soundcloudProfile : '')
                      }
                      onChange={(event) => {
                        setErrorByType((prev) => {
                          const next = { ...prev };
                          delete next[type.id];
                          return next;
                        });
                        setInputByType((prev) => ({
                          ...prev,
                          [type.id]: event.target.value,
                        }));
                      }}
                      placeholder={type.placeholder}
                      className="min-w-[18rem] flex-1"
                      required
                      disabled={
                        type.id === 'soundcloud' &&
                        (soundcloudProfileLoading || savingSoundcloudProfile)
                      }
                    />
                    <Button
                      size="sm"
                      type="submit"
                      disabled={
                        (type.id === 'soundcloud' &&
                          (soundcloudProfileLoading ||
                            savingSoundcloudProfile)) ||
                        (type.id === 'hearthis' && resolvingHearthisUrl) ||
                        !(
                          inputByType[type.id] ??
                          (type.id === 'soundcloud' ? soundcloudProfile : '')
                        ).trim()
                      }
                    >
                      {type.id === 'soundcloud' && savingSoundcloudProfile
                        ? 'Saving…'
                        : type.id === 'hearthis' && resolvingHearthisUrl
                          ? 'Resolving…'
                          : 'Add'}
                    </Button>
                  </form>
                  {errorByType[type.id] ? (
                    <p className="text-destructive text-xs" role="alert">
                      {errorByType[type.id]}
                    </p>
                  ) : null}
                  {type.id === 'hearthis' && (
                    <div className="border-border flex flex-col gap-2 border-t pt-3">
                      <p className="text-foreground-secondary text-xs">
                        Or browse your own sets to embed one directly.
                      </p>
                      <form
                        className="flex flex-wrap items-end gap-2"
                        onSubmit={(event) => {
                          event.preventDefault();
                          void loadHearthisSets();
                        }}
                      >
                        <Input
                          label="Your hearthis.at username"
                          value={hearthisUsername}
                          onChange={(event) =>
                            setHearthisUsername(event.target.value)
                          }
                          placeholder="yourname"
                          className="min-w-[14rem] flex-1"
                        />
                        <Button
                          size="sm"
                          variant="secondary"
                          type="submit"
                          disabled={hearthisSetsLoading}
                        >
                          {hearthisSetsLoading ? 'Loading…' : 'Load my sets'}
                        </Button>
                      </form>
                      {hearthisSetsError ? (
                        <p className="text-destructive text-xs" role="alert">
                          {hearthisSetsError}
                        </p>
                      ) : null}
                      {hearthisSets && hearthisSets.length > 0 ? (
                        <ul className="flex flex-col gap-1.5">
                          {hearthisSets.map((set) => (
                            <li
                              key={set.id}
                              className="border-border bg-background-secondary flex items-center gap-2 rounded-md border p-2"
                            >
                              {set.thumbUrl ? (
                                <img
                                  src={set.thumbUrl}
                                  alt=""
                                  className="size-8 shrink-0 rounded object-cover"
                                />
                              ) : null}
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">
                                  {set.title}
                                </p>
                                <p className="text-foreground-secondary text-xs">
                                  {set.trackCount} track
                                  {set.trackCount === 1 ? '' : 's'}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="secondary"
                                disabled={addingHearthisSetId === set.id}
                                onClick={() => void addHearthisSet(set)}
                              >
                                {addingHearthisSetId === set.id
                                  ? 'Adding…'
                                  : 'Add'}
                              </Button>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-foreground-secondary text-xs">
                      {type.helpText}
                    </p>
                    <Button
                      size="sm"
                      variant="text"
                      onClick={() => handleUninstall(type.id)}
                    >
                      Uninstall
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-foreground-secondary text-sm">
                  Install this add-on to add and manage embeds.
                </p>
              )}
            </ConfigurableCard>
          );
        })}
      </div>
      {installTab === 'installed' && installedCount === 0 ? (
        <p className="text-foreground-secondary text-sm">
          Nothing installed yet — check Available.
        </p>
      ) : null}
      {installTab === 'available' && availableCount === 0 ? (
        <p className="text-foreground-secondary text-sm">
          Everything here is installed.
        </p>
      ) : null}
    </div>
  );
}
