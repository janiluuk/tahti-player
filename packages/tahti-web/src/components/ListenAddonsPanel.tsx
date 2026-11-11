import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Button,
  Input,
  MediaArtwork,
  PluginStoreItem,
  Select,
  TabLabel,
  Tabs,
  Toggle,
} from '@tahti-player/ui';

import { fetchMeProfile, patchMeProfile } from '../api/studio-extras';
import {
  fetchHearthisUserSets,
  LISTENER_WIDGET_TYPES,
  mikseriChartEmbedUrl,
  mikseriMajorGenres,
  resolveHearthisPageEmbedUrl,
  resolveListenerWidgetInput,
  soundcloudProfileUrl,
  type HearthisSet,
} from '../content/listenerWidgets';
import { isHttpUrl } from '../lib/parseRss';
import {
  NEWS_WIDGET_TYPE_ID,
  useListenerWidgetsStore,
  type ListenerWidgetSurface,
} from '../stores/listenerWidgetsStore';
import { ImageUploadField } from './ImageUploadField';
import {
  ConfigurableCard,
  listenAddonIcon,
} from './listen-addons/ListenAddonCards';
import { ListenAddonsTabEmpty } from './ListenAddonsTabEmpty';
import { ListenerWidgetEmbed } from './ListenerWidgetEmbed';
import { NewsFeedSuggestions } from './NewsFeedSuggestions';
import { NewsFeedWidget } from './NewsFeedWidget';

export function ListenAddonsPanel({
  initialTab = 'installed',
  compact = false,
}: {
  initialTab?: 'installed' | 'available';
  compact?: boolean;
}) {
  const { t } = useTranslation('web');
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
  const [newsTitle, setNewsTitle] = useState(() =>
    t('listenAddonsPanelStates.news'),
  );
  const [newsFeedUrl, setNewsFeedUrl] = useState('');
  const [newsThumbnailUrl, setNewsThumbnailUrl] = useState('');
  const [newsShowListen, setNewsShowListen] = useState(true);
  const [newsShowFeed, setNewsShowFeed] = useState(true);
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
  const [mikseriGenreId, setMikseriGenreId] = useState('0');

  useEffect(() => {
    void fetchMeProfile()
      .then((profile) => {
        const accountLink = profile.data.socialLinks?.soundcloud ?? '';
        setSoundcloudProfile(soundcloudProfileUrl(accountLink) ?? accountLink);
        const hearthisHandle = profile.data.socialLinks?.hearthisAt ?? '';
        if (hearthisHandle) {
          setHearthisUsername(hearthisHandle);
        }
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
          soundcloud: t('listenAddonsPanelStates.soundcloudSaveFailed'),
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
      setHearthisSetsError(t('listenAddonsPanelStates.enterHearthisUsername'));
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

  const addMikseriChart = (
    chart: 'top40' | 'weekly' | 'promoted' | 'listataivas',
  ) => {
    const genre = mikseriMajorGenres(t).find(
      (item) => item.id === mikseriGenreId,
    );
    const label =
      chart === 'top40'
        ? t('listenAddonsPanelStates.mikseriTop40', {
            genre: genre?.label ?? t('listenAddonsPanelStates.allGenres'),
          })
        : chart === 'weekly'
          ? t('listenAddonsPanelStates.mikseriWeekly')
          : chart === 'promoted'
            ? t('listenAddonsPanelStates.mikseriPromoted')
            : 'Mikseri Listataivas';
    addInstance('mikseri', mikseriChartEmbedUrl(chart, mikseriGenreId), label);
  };

  const addNewsFeed = () => {
    const url = newsFeedUrl.trim();
    if (!isHttpUrl(url)) {
      setNewsError(t('listenAddonsPanelStates.pasteFeedUrl'));
      return;
    }
    if (!newsShowListen && !newsShowFeed) {
      setNewsError(t('listenAddonsPanelStates.showFeedWhere'));
      return;
    }
    const surfaces: ListenerWidgetSurface[] = [
      ...(newsShowListen ? (['listen'] as const) : []),
      ...(newsShowFeed ? (['feed'] as const) : []),
    ];
    addInstance(
      NEWS_WIDGET_TYPE_ID,
      url,
      newsTitle.trim() || t('listenAddonsPanelStates.news'),
      {
        thumbnailUrl: newsThumbnailUrl.trim() || undefined,
        surfaces,
      },
    );
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
            <TabLabel count={installedCount}>
              {t('listenAddonsPanelStates.installed')}
            </TabLabel>
          </Tabs.Tab>
          <Tabs.Tab>
            <TabLabel count={availableCount}>
              {t('listenAddonsPanelStates.available')}
            </TabLabel>
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.Root>
      <div className={listClassName}>
        {favoritesInstalled === (installTab === 'installed') && (
          <ConfigurableCard
            title={t('listenAddonsPanelStates.favorites')}
            open={configuringId === 'favorites'}
            onOpenChange={(open) => setConfiguringId(open ? 'favorites' : null)}
            header={(gear) => (
              <PluginStoreItem
                icon={listenAddonIcon('favorites')}
                name="Favorites"
                author="Tahti"
                description={t('listenAddonsPanelStates.favoritesDescription')}
                category="Listen"
                isInstalled={favoritesInstalled}
                onInstall={() => handleInstall('favorites')}
                compact={compact}
                accessory={
                  <>
                    {favoritesInstalled ? (
                      <Button
                        size="sm"
                        variant="text"
                        onClick={() => handleUninstall('favorites')}
                        aria-label={t(
                          'listenAddonsPanelStates.uninstallFavorites',
                        )}
                      >
                        Uninstall
                      </Button>
                    ) : null}
                    {gear}
                  </>
                }
              />
            )}
          >
            <p className="text-foreground-secondary text-sm">
              {t('listenAddonsPanelStates.favoritesEnabledHint')}
            </p>
          </ConfigurableCard>
        )}
        {newsInstalled === (installTab === 'installed') && (
          <ConfigurableCard
            title={t('listenAddonsPanelStates.news')}
            open={configuringId === NEWS_WIDGET_TYPE_ID}
            onOpenChange={(open) =>
              setConfiguringId(open ? NEWS_WIDGET_TYPE_ID : null)
            }
            header={(gear) => (
              <PluginStoreItem
                icon={listenAddonIcon(NEWS_WIDGET_TYPE_ID)}
                name="News"
                author="Tahti"
                description={t('listenAddonsPanelStates.newsDescription')}
                category="Listen"
                isInstalled={newsInstalled}
                onInstall={() => handleInstall(NEWS_WIDGET_TYPE_ID)}
                compact={compact}
                accessory={
                  <>
                    {newsInstalled ? (
                      <Button
                        size="sm"
                        variant="text"
                        onClick={() => handleUninstall(NEWS_WIDGET_TYPE_ID)}
                        aria-label={t('listenAddonsPanelStates.uninstallNews')}
                      >
                        Uninstall
                      </Button>
                    ) : null}
                    {gear}
                  </>
                }
              />
            )}
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
                <NewsFeedSuggestions
                  addedUrls={
                    new Set(newsInstances.map((instance) => instance.input))
                  }
                  onAdd={(feed) =>
                    addInstance(NEWS_WIDGET_TYPE_ID, feed.url, feed.title)
                  }
                />
                <form
                  className="flex flex-col gap-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    addNewsFeed();
                  }}
                >
                  <Input
                    label={t('listenAddonsPanelStates.title')}
                    value={newsTitle}
                    onChange={(event) => setNewsTitle(event.target.value)}
                    placeholder={t('listenAddonsPanelStates.news')}
                  />
                  <Input
                    inputMode="url"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    label={t('listenAddonsPanelStates.rssFeedUrl')}
                    value={newsFeedUrl}
                    onChange={(event) => {
                      setNewsError(null);
                      setNewsFeedUrl(event.target.value);
                    }}
                    placeholder="https://example.com/feed.xml"
                    required
                  />
                  <ImageUploadField
                    label={t('listenAddonsPanelStates.thumbnail')}
                    description={t(
                      'listenAddonsPanelStates.thumbnailDescription',
                    )}
                    value={newsThumbnailUrl}
                    onChange={setNewsThumbnailUrl}
                  />
                  <div className="flex flex-wrap gap-6">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span>{t('listenAddonsPanelStates.showOnListen')}</span>
                      <Toggle
                        label={t('listenAddonsPanelStates.showOnListen')}
                        checked={newsShowListen}
                        onChange={setNewsShowListen}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span>{t('listenAddonsPanelStates.showInFeed')}</span>
                      <Toggle
                        label={t('listenAddonsPanelStates.showInFeed')}
                        checked={newsShowFeed}
                        onChange={setNewsShowFeed}
                      />
                    </div>
                  </div>
                  <Button size="sm" type="submit" className="self-start">
                    {t('listenAddonsPanelStates.addFeed')}
                  </Button>
                </form>
                {newsError ? (
                  <p className="text-destructive text-xs" role="alert">
                    {newsError}
                  </p>
                ) : null}
                <p className="text-foreground-secondary text-xs">
                  {t('listenAddonsPanelStates.feedHint')}
                </p>
              </div>
            ) : (
              <p className="text-foreground-secondary text-sm">
                {t('listenAddonsPanelStates.installForFeeds')}
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
              header={(gear) => (
                <PluginStoreItem
                  icon={listenAddonIcon(type.id)}
                  name={type.name}
                  author={type.author}
                  description={type.description}
                  category={type.category}
                  isInstalled={isInstalled}
                  onInstall={() => handleInstall(type.id)}
                  compact={compact}
                  accessory={
                    <>
                      {isInstalled ? (
                        <Button
                          size="sm"
                          variant="text"
                          onClick={() => handleUninstall(type.id)}
                          aria-label={t(
                            'listenAddonsPanelStates.uninstallNamed',
                            { name: type.name },
                          )}
                        >
                          {t('listenAddonsPanelStates.uninstall')}
                        </Button>
                      ) : null}
                      {gear}
                    </>
                  }
                />
              )}
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
                      label={t('listenAddonsPanelLabels.addALink', {
                        name: type.name,
                      })}
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
                        ? t('listenAddonsPanelStates.saving')
                        : type.id === 'hearthis' && resolvingHearthisUrl
                          ? t('listenAddonsPanelStates.resolving')
                          : t('listenAddonsPanelStates.add')}
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
                        {t('listenAddonsPanelStates.browseOwnSets')}
                      </p>
                      <form
                        className="flex flex-wrap items-end gap-2"
                        onSubmit={(event) => {
                          event.preventDefault();
                          void loadHearthisSets();
                        }}
                      >
                        <Input
                          autoCapitalize="none"
                          autoCorrect="off"
                          spellCheck={false}
                          label={t(
                            'listenAddonsPanelStates.yourHearthisUsername',
                          )}
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
                          {hearthisSetsLoading
                            ? t('listenAddonsPanelStates.loading')
                            : t('listenAddonsPanelStates.loadMySets')}
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
                              <MediaArtwork
                                size="thumb"
                                src={set.thumbUrl}
                                alt=""
                                className="shrink-0 rounded"
                                imageReveal={Boolean(set.thumbUrl)}
                              />
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
                                  ? t('listenAddonsPanelStates.adding')
                                  : t('listenAddonsPanelStates.add')}
                              </Button>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  )}
                  {type.id === 'mikseri' ? (
                    <div className="border-border flex flex-col gap-3 border-t pt-3">
                      <p className="text-foreground-secondary text-xs">
                        {t('listenAddonsPanelStates.mikseriHint')}
                      </p>
                      <Select
                        label={t('listenAddonsPanelStates.top40Genre')}
                        value={mikseriGenreId}
                        onValueChange={setMikseriGenreId}
                        options={[...mikseriMajorGenres(t)]}
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => addMikseriChart('top40')}
                        >
                          {t('listenAddonsPanelStates.addTop40')}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => addMikseriChart('listataivas')}
                        >
                          {t('listenAddonsPanelStates.addListataivas')}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => addMikseriChart('weekly')}
                        >
                          {t('listenAddonsPanelStates.addWeekly')}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => addMikseriChart('promoted')}
                        >
                          {t('listenAddonsPanelStates.addPromoted')}
                        </Button>
                      </div>
                    </div>
                  ) : null}
                  <p className="text-foreground-secondary text-xs">
                    {type.helpText}
                  </p>
                </div>
              ) : (
                <p className="text-foreground-secondary text-sm">
                  {t('listenAddonsPanelStates.installForEmbeds')}
                </p>
              )}
            </ConfigurableCard>
          );
        })}
      </div>
      <ListenAddonsTabEmpty
        tab={installTab}
        installedCount={installedCount}
        availableCount={availableCount}
        onBrowse={() => setInstallTab('available')}
      />
    </div>
  );
}
