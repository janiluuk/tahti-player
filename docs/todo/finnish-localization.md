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

## Left

- [ ] Use `web.actions` in shared buttons: `ShareButton`, `EditIconButton`, `ConfirmDialog` defaults, follow and favorite buttons, and download buttons. Ui components need `labels` props for this.
- [ ] Settings panel bodies: Account, Artist, Channel, Broadcast, Playback, Integrations, Themes, Add-ons and What's new.
- [ ] Notifications and Messages popovers, GlobalSearch, the auth dialog and toasts.
- [ ] Sub-rows on Listen (Tahti Selects, New releases, Trending, Coming up, Radio) and Discover widget titles (`WIDGET_LABELS`).
- [ ] Library sub-pages: Favorites, History, Following, Sounds, Collections, Upload, Media, Stash and Embeds. The Overview stat cards.
- [ ] Studio and Admin page bodies, Radio, channel pages, track and release pages (`ChannelView`, `track-detail` and `FullScreenPlayer` were being changed by other work and were left out).
- [ ] Other date helpers: `humanizeDate.ts`, `storyDate.ts` and the `ListingDate` title (`toLocaleString`). `numericDate` (`d.m.yyyy`) needs no change.
- [ ] Views that do not call `useTranslation` render again only when something else changes, so a date or label can stay in the old language until then. Check this after more views are translated.
- [ ] Page `<title>` and SEO strings (`lib/seo.ts`). The page tour (`lib/pageTour.ts`). Keyboard shortcuts help.
- [ ] Optional: detect a Finnish browser on first visit. `matchBrowserLocales` exists, but the default stays English until product decides.
- [ ] When Settings is reduced to account-only (`simplify-studio-library-settings-admin.md`), move Language into Appearance.
