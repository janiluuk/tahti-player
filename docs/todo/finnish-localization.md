# Finnish localization for tahti-web

**Status:** partial

Users can pick English or Suomi in **Settings → Language**. English is the default and the source of truth.

## How it works

- Strings live in the `web` namespace of `packages/i18n/src/locales/en_US.json`, and the Finnish strings are in `fi_FI.json`. `packages/i18n/src/locales.test.ts` fails if any English key has no Finnish string. Finnish is a lazy chunk (`lazyLocales.ts`).
- Components call `useTranslation('web')` and `t('nav.listen')`. Code outside React calls `i18n.t('web:...')` (see `lib/relativeDate.ts`). Lists defined at module level store a `labelKey` instead of a label (`settingsNav.ts`, `MobileChrome.tsx`, `LibraryView.tsx`, `ListenView.tsx`, `DiscoverView.tsx`).
- `stores/languageStore.ts` is a zustand store persisted to localStorage as `tahti-language`. Its `setLocale` calls `lib/locale.ts` `applyLocale`, which changes the i18n language and sets `<html lang>`. `main.tsx` applies the saved language before the app mounts. If loading the Finnish chunk fails, the app stays in English.
- The menu lists only `WEB_LOCALES` (English and Suomi). The player catalog has nine more languages, but they have no `web` strings.
- Ui components that have built-in English labels take a `labels` prop instead of importing i18n, for example `PlayerBar.Controls` (`next`, `previous`) and `PlayerBar.Volume` (`mute`, `unmute`, `volume`).

## Translated

- Desktop sidebar, mobile drawer and bottom nav (including More), top bar (menu, back and forward, search, log in) and the account menu.
- Settings: section titles, descriptions, group headings and the Log in button. The Language panel itself. Studio nav was already translated.
- Player bar: play, pause, previous, next, shuffle, repeat and loop, mute, volume, queue and full screen, plus the "nothing playing" text and error lines.
- Listen: tabs, title, section names, row filters, live, replay and new-tracks empty states.
- Discover: tabs, title, filters, venue links, widget empty messages and the artist directory error.
- Library: every tab, page titles, overview heading, catalog error and the empty states.
- Common actions in the catalog under `web.actions` (Play, Pause, Share, Edit, Save, Cancel, Delete, Close, Download, Follow, Favorite and others). So far they are used only on the surfaces listed above.
- `relativeDate` ("juuri nyt", "5 minuuttia sitten", "1 päivä sitten").
- `humanizeDate.ts` / `storyDate.ts` (delegate to `relativeDate`).
- `ListingDate` `<time title>` locale via `currentLocale` + `toBcp47`.
- tahti-web `ConfirmDialog` wrapper defaults (`web.actions.confirm` / `cancel`); `EditIconButton` wrapper default label; `ChannelShareButton` trigger share label.
- Discover widget titles (`WIDGET_LABEL_KEYS` + `discover.widgets.*`).
- Listen sub-rows: Tahti Selects, New releases, Trending, Radio filter labels; Listen section order label for Selects-only layout.
- Library tab `<title>` strings in `lib/seo.ts` (`library.tab*` + `nav.library`).
- Favorite, download and track-table play/favorite labels via `web.actions` (`MediaIconActions`, `TrackHero`, `CollectionView`, `RadioView`, context menu, action sheet, `trackTableLabels`, channel stage, sound/release download buttons).
- Settings → Playback and Themes bodies (`web.settingsPlayback`, `web.settingsThemes`).
- Listen Radio row (title, badge, empty, curated-stations error) and the Coming up row (title, badge, filter, error, locale-aware event start).
- Non-Library page `<title>` strings in `lib/seo.ts` (`web.seo.*`); route descriptions and the default title stay English.
- Artist follow (`ArtistFollowButton` → `web.actions.followArtist` / `logInToFollow` / `unfollowArtist`); GlobalSearch; notifications popover chrome; Settings Account tab group headings; Library Embeds empty/load error (batch 31).
- Batch 32 follow-up (#1818): `ReleaseTrackDownloads` and track-info Love / Loved via `web.actions`.
- Batch 34: Settings → Integrations, Add-ons (group titles, category tabs, scrobbling notice) and What's new chrome; Library History (tabs, toolbar, filter, pagination, toasts, plural counts) and Following; Admin section tabs, page labels, hub titles and descriptions; channel page actions and the share dialog; track download gate; auth-flow toasts (connect, sign in to buy, device sign-out); `libraryFormat` track counts with a Finnish plural; `seo.ts` Library, Studio and Admin child titles.
- Batch 33: Library Overview stat cards and `formatPlayCount` plural (`web.library.plays`); Radio tabs, loading and recent-plays copy (`web.radio.*`); Messages popover (`web.messagesPopover.*`); processing-failure toast (`web.toasts.*`); FullScreenPlayer chrome and controls (`web.player.*`); `TrackHero` back, share and add; Settings Account tabs/session/membership/subscriptions/purchases, Artist tabs and load errors, Channel page and chat/moderator pointers, Broadcast radio and green room (`web.settingsBody.*`).
- Batch 33, second pass: Settings switches for channel autoplay, top lists, broadcast recording/publish, comments and MusicBrainz (`web.toggles.*`); Library Following (`library.following*`); Radio `<title>` description (`seo.radio*`); `TrackHero` play/pause/edit; chart and heatmap date labels follow the app language.

## Left

- [ ] Use `web.actions` in the remaining share/edit/follow call sites that still import `@tahti-player/ui` directly, and the other download labels (`StashFilesPanel`, `MembershipInvoices`, `StemMixer`). Ui components need `labels` props where the player must stay English-only.
- [ ] Settings panel bodies: the forms inside Account, Artist, Channel and Broadcast (field labels, save buttons, toasts).
- [ ] Notification item text and the other toasts (only the processing-failure toast is translated).
- [ ] Listen: plugin-store `DISCOVER_WIDGET_LABELS`.
- [ ] Library sub-pages: remaining page bodies (History Stats tab and Across your devices panel, Sounds, Collections, Upload). Overview stat cards, History list and Following are done.
- [ ] Studio and Admin page bodies (admin hub card descriptions per page stay English), Radio below the tabs, channel pages, the rest of track and release pages (`ChannelView`, `track-detail` below the hero).
- [ ] Views that do not call `useTranslation` render again only when something else changes, so a date or label can stay in the old language until then. Check this after more views are translated.
- [ ] Route SEO descriptions and the default title (`lib/seo.ts`). The page tour (`lib/pageTour.ts`). Keyboard shortcuts help (`content/keyboardNavigation.ts` is a large content table).
- [ ] Optional: detect a Finnish browser on first visit. `matchBrowserLocales` exists, but the default stays English until product decides.
- [ ] When Settings is reduced to account-only (`simplify-studio-library-settings-admin.md`), move Language into Appearance.
