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
- Batch 35: Settings Logs chrome; Studio hub empty discography + governance/recent titles; Admin Inbox tabs; Discover community stories; Radio station page; collection Play/queue/Jam; Broadcast green-room pool labels; support tickets chrome; transparency ledger empty; public governance history; Studio sounds/releases toasts; artist Joined / channel rename / fan-sub Ends on.
- Batch 36: Settings Account cancel/storage; Artist identity fields; Channel domain tab; Notifications page chrome; Library Sounds/Collections/Upload; History Stats + Across devices; channel tabs + upcoming empty; track comments/details labels; Admin missed-shows empty; Stash/Membership/StemMixer download labels via `web.actions`; Discover add-on widget labels via `WIDGET_LABEL_KEYS`.
- Batch 37: Settings Account password/email/privacy + storage bodies; Artist story/people/connections/branding save labels; Channel rename confirm + slug/domain toasts; SoundFilters + Collections create/search + Upload picker; History Stats day/calendar/empty-range chrome; Studio Sounds load-more; Studio Releases chrome; Admin missed-shows filters/queue actions; Radio below-tabs chrome; channel embeds/tracks/chat blocks; toast subset (history clear, playable, stash revoke, artist/collection saves); editDetails / editInStudio / editFullBio via `web.actions`.
- Batch 38: Settings Devices/2FA/API tokens + Notifications/visibility bodies; password rules via i18n; Artist pronouns/roles; Channel Designer/Discovery/Chat/Moderators tabs; Library Collections create fields + Sounds dialogs/bulk/selection; Studio Releases types + Release detail chrome; Admin content-reports filters; Radio below-tabs leftovers; channel shows/stats/programming blocks; track detail + smart-link public release chrome; toast/action subset (share revoke, image updated, left group, media removed, editNamed/editMotion/shareWith).
- Batch 39: Notifications preference sample lines; Mentions panel; reset/setup password; Library Media; Sounds selection bar + bulk edit fields; Studio Releases toolbar + release detail leftovers; Admin content-reports resolve copy; Radio just-played labels; channel navigation/links blocks; Group detail; track buy/PWYW; Stash share/play via `web.actions`; MentionsPanel Storybook.
- Batch 40: AddToPlaylistButton / TrackInfoDialog / PlayableAmbientTrackList edit-remove-playlist + track-table queue labels via `web.actions`; Library Upload still-processing + Sounds processing/uploaded lines; Studio Events + Groups chrome; ThemesTab moderation; Admin Radio member-relay; Collection page empty/stats/load; collaborative playlist section; Stash/share/play-history ConfirmDialogs; Studio Updates + Now Playing toast subset; AddToPlaylistButton Storybook.
- Batch 41: Sounds status extras + stats strip + retry; Upload import-source status chrome; Studio Groups create/settings/detail + policy options/counts; Studio Listening parties chrome/empty/ConfirmDialog; track comment remove ConfirmDialog; Radio `formatAgo`; channel look + broadcast preflight toasts; StudioGroups/ListeningParties Storybook headings.
- Batch 42: Track repost/share/purchase toasts; collaborative playlist add; artist more/bio/feed toasts; moderate-channel stop; channel stage labels/empty; track-edit saved toast; Studio Shows/Stash/Revenue/Home empties; profile order dialogs; release versions/credits + TopLists empties; TrackInfo/FollowList/Embed Close via `web.actions`; StudioShows/Home Storybook.
- Batch 43: UploadTrackDialog + NewReleaseTrackUploadDialog picker; CoverArtPicker; DmBlock ConfirmDialog/toasts; channel-designer preset/backdrop/look toasts; HomeHighlights release toasts; stream overlay + radio playlist rotation toasts; newsletter already-subscribed; ChannelComments empty/ConfirmDialog; PinnedAnnouncements remove ConfirmDialog; Studio Fans hub; Studio Hubs Fans Storybook.
- Batch 45: Studio playlist/collection/track-edit/release/sound/stats/waveform OrganizeFiles; Admin comments/topics/test-notification/artwork; materials; ArtistStore; context-menu Added to; OAuth/Spotify; Fan billing; TrackEditor undo; ProfileOrder; Onboarding; PlayableTrackTable queue.
- Batch 44: Studio Recordings / Distribution / Editor list chrome+empties; radio 24/7 settings + rotation source + channel-created + Tahti Radio submit toasts; collection reorder/save + release version/credits toasts; Go live + playlist remove + multistream ConfirmDialogs; channel-designer Save/Delete/Reset and ArtworkPreset Cancel via `web.actions`; grant-report visibility toast; StudioDistribution Storybook.

## Left

- [ ] Use `web.actions` in the remaining share/edit/follow call sites that still import `@tahti-player/ui` directly. Ui components need `labels` props where the player must stay English-only. Batches 36–44 covered track repost, Close on TrackInfo/FollowList/Embed, collaborative add, CoverArt Cancel, channel-designer/artwork Cancel, and earlier playlist/edit/download subsets.
- [ ] Notification **item** title/body from the API, and remaining toasts outside Notifications page chrome / processing-failure / Studio sounds-releases / batches 37–44 toast subsets (track share/purchase/repost, collaborative add, artist bio/feed, moderate leave, channel stream, track-edit saved, channel-designer, overlay, radio playlist, newsletter, HomeHighlights, radio 24/7/rotation/channel-created/radio-submit, collection edit, release version/credits, multistream, grant visibility, batch 45 playlist/editor/waveform/admin/materials/oauth subset).
- [ ] Library Upload page leftovers beyond dialog/import-source/release-track picker (batch 41–43). History Stats chart axis labels stay chart-kept. Genre option labels in bulk edit stay English catalog names.
- [ ] Studio and Admin page bodies beyond the batch 41–44 Groups/Listening-parties/Shows/Stash/Revenue/Home/TopLists/release-empty/Fans-hub/ChannelComments/Recordings/Distribution/Editor-list subsets (admin hub card descriptions per page stay English), channel schedule “Next up” stays schedule Kept, more Radio station chrome beyond `formatAgo` and stage labels.
- [ ] Views that do not call `useTranslation` render again only when something else changes, so a date or label can stay in the old language until then. Check this after more views are translated.
- [ ] Route SEO descriptions and the default title (`lib/seo.ts`). The page tour (`lib/pageTour.ts`). Keyboard shortcuts help (`content/keyboardNavigation.ts` is a large content table).
- [ ] Optional: detect a Finnish browser on first visit. `matchBrowserLocales` exists, but the default stays English until product decides.
- [ ] When Settings is reduced to account-only (`simplify-studio-library-settings-admin.md`), move Language into Appearance.
