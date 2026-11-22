import {
  BarChart3Icon,
  ChevronDownIcon,
  ChevronUpIcon,
  CopyIcon,
  ExternalLinkIcon,
  GripVerticalIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import { Button, ButtonAnchor, Input } from '@tahti-player/ui';

import {
  EMPTY_LINK_PAGE_CONFIG,
  parseLinkPageConfig,
  type LinkPageConfig,
  type LinkPageOwnLink,
  type PublicLinkPage,
} from '../../api/link-page';
import {
  fetchMeProfile,
  patchMeProfile,
  type ProfileFields,
} from '../../api/studio-extras';
import type { StudioCollection, StudioSound } from '../../api/studio-types';
import { fetchStudioCollections } from '../../api/studio/studio-collections';
import { fetchStudioSoundsPage } from '../../api/studio/studio-sounds-library';
import type { PublicProfile } from '../../api/types';
import { PageError } from '../../components/PageStates';
import { socialLinksForPreview } from '../../lib/linkPageSocials';
import { LinkPageView } from '../link-page/LinkPageView';

const LINK_PAGE_PICK_MAX = 20;

function newOwnLink(): LinkPageOwnLink {
  return {
    id: `own-${crypto.randomUUID().slice(0, 8)}`,
    label: '',
    url: 'https://',
  };
}

function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length || from === to) {
    return items;
  }
  const next = [...items];
  const [row] = next.splice(from, 1);
  next.splice(to, 0, row);
  return next;
}

export function LinkPageEditor() {
  const { t } = useTranslation('web');
  const [profile, setProfile] = useState<ProfileFields | null>(null);
  const [draft, setDraft] = useState<LinkPageConfig>(EMPTY_LINK_PAGE_CONFIG);
  const [sounds, setSounds] = useState<StudioSound[]>([]);
  const [collections, setCollections] = useState<StudioCollection[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [soundPickerOpen, setSoundPickerOpen] = useState(false);
  const [setPickerOpen, setSetPickerOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      fetchMeProfile(),
      fetchStudioSoundsPage({
        isPublic: true,
        status: 'READY',
        sort: 'newest',
        limit: 100,
      }),
      fetchStudioCollections(),
    ]).then(([profileResult, soundsResult, collectionsResult]) => {
      if (cancelled) {
        return;
      }
      if (profileResult.meta.reason && !profileResult.data.id) {
        setLoadError(profileResult.meta.reason);
        return;
      }
      setProfile(profileResult.data);
      setDraft(parseLinkPageConfig(profileResult.data.linkPage));
      setSounds(soundsResult.data.items);
      setCollections(
        collectionsResult.data.filter(
          (collection) => collection.isPublic && Boolean(collection.id),
        ),
      );
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const soundById = useMemo(
    () => new Map(sounds.map((sound) => [sound.id, sound])),
    [sounds],
  );
  const collectionById = useMemo(() => {
    const map = new Map<string, StudioCollection>();
    for (const collection of collections) {
      if (collection.id) {
        map.set(collection.id, collection);
      }
    }
    return map;
  }, [collections]);

  const previewProfile = useMemo((): PublicProfile | null => {
    if (!profile) {
      return null;
    }
    const profileLinks = socialLinksForPreview(profile.socialLinks);
    const ownLinks = draft.ownLinks
      .filter((link) => link.label.trim() && link.url.trim().startsWith('http'))
      .map((link) => ({
        key: `own:${link.id}`,
        label: link.label,
        url: link.url,
        source: 'own' as const,
        id: link.id,
      }));
    const previewSounds =
      draft.soundIds.length > 0
        ? draft.soundIds
            .map((id) => soundById.get(id))
            .filter((sound): sound is StudioSound => Boolean(sound))
            .map((sound) => ({
              id: sound.id,
              title: sound.title,
              coverUrl: sound.bannerUrl ?? null,
              durationSec: sound.durationSec ?? null,
              playUrl: null,
              badge: null as null,
            }))
        : sounds.slice(0, 5).map((sound) => ({
            id: sound.id,
            title: sound.title,
            coverUrl: sound.bannerUrl ?? null,
            durationSec: sound.durationSec ?? null,
            playUrl: null,
            badge: null as null,
          }));
    const previewSets =
      draft.setIds.length > 0
        ? draft.setIds
            .map((id) => collectionById.get(id))
            .filter((collection): collection is StudioCollection =>
              Boolean(collection),
            )
            .map((collection) => ({
              id: collection.id!,
              slug: collection.slug,
              name: collection.name,
              coverUrl: collection.coverUrl ?? null,
              itemCount: collection.itemCount ?? collection.items?.length ?? 0,
              url: `/u/${profile.username}/c/${collection.slug}`,
            }))
        : collections.slice(0, 5).map((collection) => ({
            id: collection.id!,
            slug: collection.slug,
            name: collection.name,
            coverUrl: collection.coverUrl ?? null,
            itemCount: collection.itemCount ?? collection.items?.length ?? 0,
            url: `/u/${profile.username}/c/${collection.slug}`,
          }));
    const linkPage: PublicLinkPage = {
      playMode: draft.playMode,
      links: [...profileLinks, ...ownLinks],
      sounds: previewSounds,
      sets: previewSets,
      siteUrl: `https://${profile.username}.tahti.live`,
      linkPageUrl: `https://tahti.live/u/${profile.username}`,
    };
    return {
      artist: {
        username: profile.username,
        displayName: profile.displayName,
        bio: profile.bio,
        fullBio: profile.fullBio ?? null,
        avatarUrl: profile.avatarUrl ?? null,
        defaultLocation: profile.defaultLocation ?? null,
        countryCode: profile.countryCode ?? null,
        socialLinks: profile.socialLinks ?? null,
      },
      channel: null,
      releases: [],
      tracks: [],
      fanTiers: [],
      collections: [],
      purchaseTiers: [],
      storePaymentsReady: false,
      links: {
        channel: null,
        subscribe: `/u/${profile.username}/subscribe`,
        feeds: { sound: null },
        presskit: '',
      },
      linkPage,
    };
  }, [profile, draft, soundById, collectionById, sounds, collections]);

  if (loadError) {
    return (
      <PageError
        title={t('settingsBody.artist.loadError')}
        description={loadError}
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!profile) {
    return (
      <p className="text-foreground-secondary text-sm">
        {t('loading.loading')}
      </p>
    );
  }

  const linkPageUrl = `https://tahti.live/u/${profile.username}`;
  const unusedSounds = sounds.filter(
    (sound) => !draft.soundIds.includes(sound.id),
  );
  const unusedSets = collections.filter(
    (collection) =>
      Boolean(collection.id) && !draft.setIds.includes(collection.id!),
  );

  const save = async () => {
    setSaving(true);
    const cleaned: LinkPageConfig = {
      ...draft,
      ownLinks: draft.ownLinks.filter(
        (link) => link.label.trim() && /^https?:\/\//i.test(link.url.trim()),
      ),
      soundIds: draft.soundIds.slice(0, LINK_PAGE_PICK_MAX),
      setIds: draft.setIds.slice(0, LINK_PAGE_PICK_MAX),
    };
    const result = await patchMeProfile({ linkPage: cleaned });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setProfile(result.data);
    setDraft(parseLinkPageConfig(result.data.linkPage));
    toast.success(t('linkPage.save'));
  };

  return (
    <div
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]"
      data-testid="link-page-editor"
    >
      <div className="flex flex-col gap-6">
        <section className="border-border flex flex-col gap-3 rounded-lg border p-4">
          <h2 className="text-foreground text-base font-bold">
            {t('linkPage.yourLinkPage')}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              readOnly
              value={linkPageUrl}
              className="min-w-0 flex-1"
              aria-label={t('linkPage.yourLinkPage')}
            />
            <Button
              size="icon"
              variant="secondary"
              aria-label={t('linkPage.openLinkPage')}
              onClick={() => {
                void navigator.clipboard
                  .writeText(linkPageUrl)
                  .then(() => toast.success(t('toasts.linkCopied')));
              }}
            >
              <CopyIcon size={16} />
            </Button>
          </div>
          <p className="text-foreground-secondary text-sm">
            {t('linkPage.storiesHint')}
          </p>
          <div className="flex flex-wrap gap-2">
            <ButtonAnchor
              href={linkPageUrl}
              target="_blank"
              rel="noopener noreferrer"
              size="sm"
              variant="secondary"
            >
              <ExternalLinkIcon size={14} aria-hidden className="mr-1.5" />
              {t('linkPage.openLinkPage')}
            </ButtonAnchor>
            <Button size="sm" variant="secondary" disabled>
              <BarChart3Icon size={14} aria-hidden className="mr-1.5" />
              {t('linkPage.statistics')}
            </Button>
          </div>
        </section>

        <section className="border-border flex flex-col gap-3 rounded-lg border p-4">
          <h2 className="text-foreground text-base font-bold">
            {t('linkPage.links')}
          </h2>
          <p className="text-foreground-secondary text-sm">
            {t('linkPage.linksHint')}
          </p>
          <ul className="flex flex-col gap-2">
            {socialLinksForPreview(profile.socialLinks).map((link) => (
              <li
                key={link.key}
                className="border-border bg-background-secondary flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
              >
                <GripVerticalIcon
                  size={14}
                  className="text-foreground-secondary opacity-40"
                  aria-hidden
                />
                <span className="font-medium">{link.label}</span>
                <span className="text-foreground-secondary truncate">
                  {link.url}
                </span>
              </li>
            ))}
            {draft.ownLinks.map((link, index) => (
              <li
                key={link.id}
                className="border-border flex flex-col gap-2 rounded-md border p-3"
              >
                <div className="flex items-center gap-2">
                  <div className="flex flex-col">
                    <Button
                      size="icon-sm"
                      variant="text"
                      disabled={index === 0}
                      aria-label={t('actions.moveUp')}
                      onClick={() =>
                        setDraft({
                          ...draft,
                          ownLinks: moveItem(draft.ownLinks, index, index - 1),
                        })
                      }
                    >
                      <ChevronUpIcon size={14} />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="text"
                      disabled={index === draft.ownLinks.length - 1}
                      aria-label={t('actions.moveDown')}
                      onClick={() =>
                        setDraft({
                          ...draft,
                          ownLinks: moveItem(draft.ownLinks, index, index + 1),
                        })
                      }
                    >
                      <ChevronDownIcon size={14} />
                    </Button>
                  </div>
                  <Input
                    label={t('linkPage.ownLinkLabel')}
                    value={link.label}
                    onChange={(e) => {
                      const next = [...draft.ownLinks];
                      next[index] = { ...link, label: e.target.value };
                      setDraft({ ...draft, ownLinks: next });
                    }}
                  />
                  <Button
                    size="icon-sm"
                    variant="text"
                    aria-label={t('actions.remove')}
                    onClick={() => {
                      setDraft({
                        ...draft,
                        ownLinks: draft.ownLinks.filter(
                          (item) => item.id !== link.id,
                        ),
                      });
                    }}
                  >
                    <Trash2Icon size={14} />
                  </Button>
                </div>
                <Input
                  label={t('linkPage.ownLinkUrl')}
                  value={link.url}
                  onChange={(e) => {
                    const next = [...draft.ownLinks];
                    next[index] = { ...link, url: e.target.value };
                    setDraft({ ...draft, ownLinks: next });
                  }}
                />
              </li>
            ))}
          </ul>
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              setDraft({
                ...draft,
                ownLinks: [...draft.ownLinks, newOwnLink()],
              })
            }
          >
            <PlusIcon size={14} aria-hidden className="mr-1.5" />
            {t('linkPage.addOwnLink')}
          </Button>
        </section>

        <section className="border-border flex flex-col gap-3 rounded-lg border p-4">
          <h2 className="text-foreground text-base font-bold">
            {t('linkPage.sounds')}
          </h2>
          <p className="text-foreground-secondary text-sm">
            {t('linkPage.soundsHint')}
          </p>
          <p className="text-foreground-secondary text-sm">
            {t('linkPage.soundsDefault')}
          </p>
          <ul className="flex flex-col gap-2">
            {draft.soundIds.map((id, index) => {
              const sound = soundById.get(id);
              return (
                <li
                  key={id}
                  className="border-border flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                >
                  <div className="flex flex-col">
                    <Button
                      size="icon-sm"
                      variant="text"
                      disabled={index === 0}
                      aria-label={t('actions.moveUp')}
                      onClick={() =>
                        setDraft({
                          ...draft,
                          soundIds: moveItem(draft.soundIds, index, index - 1),
                        })
                      }
                    >
                      <ChevronUpIcon size={14} />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="text"
                      disabled={index === draft.soundIds.length - 1}
                      aria-label={t('actions.moveDown')}
                      onClick={() =>
                        setDraft({
                          ...draft,
                          soundIds: moveItem(draft.soundIds, index, index + 1),
                        })
                      }
                    >
                      <ChevronDownIcon size={14} />
                    </Button>
                  </div>
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {sound?.title ?? id}
                  </span>
                  <Button
                    size="icon-sm"
                    variant="text"
                    aria-label={t('actions.remove')}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        soundIds: draft.soundIds.filter(
                          (soundId) => soundId !== id,
                        ),
                      })
                    }
                  >
                    <Trash2Icon size={14} />
                  </Button>
                </li>
              );
            })}
          </ul>
          {soundPickerOpen ? (
            <ul className="border-border max-h-48 overflow-y-auto rounded-md border">
              {unusedSounds.length === 0 ? (
                <li className="text-foreground-secondary px-3 py-2 text-sm">
                  —
                </li>
              ) : (
                unusedSounds.map((sound) => (
                  <li key={sound.id}>
                    <button
                      type="button"
                      className="hover:bg-background-secondary w-full px-3 py-2 text-left text-sm"
                      disabled={draft.soundIds.length >= LINK_PAGE_PICK_MAX}
                      onClick={() => {
                        setDraft({
                          ...draft,
                          soundIds: [...draft.soundIds, sound.id].slice(
                            0,
                            LINK_PAGE_PICK_MAX,
                          ),
                        });
                        setSoundPickerOpen(false);
                      }}
                    >
                      {sound.title}
                    </button>
                  </li>
                ))
              )}
            </ul>
          ) : null}
          <Button
            size="sm"
            variant="secondary"
            disabled={draft.soundIds.length >= LINK_PAGE_PICK_MAX}
            onClick={() => setSoundPickerOpen((open) => !open)}
          >
            <PlusIcon size={14} aria-hidden className="mr-1.5" />
            {t('linkPage.addSound')}
          </Button>
        </section>

        <section className="border-border flex flex-col gap-3 rounded-lg border p-4">
          <h2 className="text-foreground text-base font-bold">
            {t('linkPage.sets')}
          </h2>
          <p className="text-foreground-secondary text-sm">
            {t('linkPage.setsHint')}
          </p>
          <p className="text-foreground-secondary text-sm">
            {t('linkPage.setsDefault')}
          </p>
          <ul className="flex flex-col gap-2">
            {draft.setIds.map((id, index) => {
              const collection = collectionById.get(id);
              return (
                <li
                  key={id}
                  className="border-border flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                >
                  <div className="flex flex-col">
                    <Button
                      size="icon-sm"
                      variant="text"
                      disabled={index === 0}
                      aria-label={t('actions.moveUp')}
                      onClick={() =>
                        setDraft({
                          ...draft,
                          setIds: moveItem(draft.setIds, index, index - 1),
                        })
                      }
                    >
                      <ChevronUpIcon size={14} />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="text"
                      disabled={index === draft.setIds.length - 1}
                      aria-label={t('actions.moveDown')}
                      onClick={() =>
                        setDraft({
                          ...draft,
                          setIds: moveItem(draft.setIds, index, index + 1),
                        })
                      }
                    >
                      <ChevronDownIcon size={14} />
                    </Button>
                  </div>
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {collection?.name ?? id}
                  </span>
                  <Button
                    size="icon-sm"
                    variant="text"
                    aria-label={t('actions.remove')}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        setIds: draft.setIds.filter((setId) => setId !== id),
                      })
                    }
                  >
                    <Trash2Icon size={14} />
                  </Button>
                </li>
              );
            })}
          </ul>
          {setPickerOpen ? (
            <ul className="border-border max-h-48 overflow-y-auto rounded-md border">
              {unusedSets.length === 0 ? (
                <li className="text-foreground-secondary px-3 py-2 text-sm">
                  —
                </li>
              ) : (
                unusedSets.map((collection) => (
                  <li key={collection.id}>
                    <button
                      type="button"
                      className="hover:bg-background-secondary w-full px-3 py-2 text-left text-sm"
                      disabled={draft.setIds.length >= LINK_PAGE_PICK_MAX}
                      onClick={() => {
                        if (!collection.id) {
                          return;
                        }
                        setDraft({
                          ...draft,
                          setIds: [...draft.setIds, collection.id].slice(
                            0,
                            LINK_PAGE_PICK_MAX,
                          ),
                        });
                        setSetPickerOpen(false);
                      }}
                    >
                      {collection.name}
                    </button>
                  </li>
                ))
              )}
            </ul>
          ) : null}
          <Button
            size="sm"
            variant="secondary"
            disabled={draft.setIds.length >= LINK_PAGE_PICK_MAX}
            onClick={() => setSetPickerOpen((open) => !open)}
          >
            <PlusIcon size={14} aria-hidden className="mr-1.5" />
            {t('linkPage.addSet')}
          </Button>
        </section>

        <section className="border-border flex flex-col gap-3 rounded-lg border p-4">
          <h2 className="text-foreground text-base font-bold">
            {t('linkPage.playbackTitle')}
          </h2>
          <div className="flex flex-col gap-2">
            {(
              [
                ['inline', 'playbackInline', 'playbackInlineHint'],
                ['open', 'playbackOpen', 'playbackOpenHint'],
              ] as const
            ).map(([mode, titleKey, hintKey]) => {
              const selected = draft.playMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  className={
                    selected
                      ? 'border-accent-red-strong rounded-lg border-2 p-3 text-left'
                      : 'border-border rounded-lg border p-3 text-left'
                  }
                  aria-pressed={selected}
                  onClick={() => setDraft({ ...draft, playMode: mode })}
                >
                  <div className="text-foreground font-semibold">
                    {t(`linkPage.${titleKey}`)}
                  </div>
                  <div className="text-foreground-secondary mt-1 text-sm">
                    {t(`linkPage.${hintKey}`)}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <div className="flex justify-end">
          <Button onClick={() => void save()} disabled={saving}>
            {t('linkPage.save')}
          </Button>
        </div>
      </div>

      <aside className="border-border bg-background-secondary/40 sticky top-4 flex max-h-[80vh] flex-col overflow-hidden rounded-lg border">
        <div className="border-border flex items-center justify-between border-b px-3 py-2">
          <span className="text-foreground text-sm font-bold">
            {t('linkPage.preview')}
          </span>
          <span className="text-foreground-secondary text-xs">
            {t('linkPage.previewHint')}
          </span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <LinkPageView
            profile={previewProfile}
            loading={false}
            error={null}
            onRetry={() => undefined}
          />
        </div>
      </aside>
    </div>
  );
}
