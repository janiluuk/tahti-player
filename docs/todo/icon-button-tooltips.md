# Icon-button Tooltip sweep

**Status:** in progress (Studio surface done 2026-09-04). Next: Admin + PluginStorePanel.
**Storybook:** `Components/Tooltip` → `SidebarIcons`.
**Next:** Admin stream manager, storage, PluginStorePanel, Settings add-ons. Re-scan before claiming 0.

Every icon-only control must use Storybook `Tooltip` for the hover/focus label. Keep `aria-label` for assistive tech. Do not treat native `title=` as the tooltip.

```tsx
<Tooltip content="Configure visualizer" side="top">
  <Button size="icon-sm" aria-label="Configure visualizer">
    <SettingsIcon size={15} aria-hidden />
  </Button>
</Tooltip>
```

Prefer wrapping once in shared primitives so consumers inherit it.

## Leave

- Buttons with visible text (not icon-only)
- `Tooltip` “?” help badges (form-help sweep, not this list)
- Drag handles if the label is already in surrounding copy **and** `aria-label` is set — still wrap if the control is icon-only
- Full-screen player / Pro Editor take-over: still wrap; missing chrome is fine, missing tooltip is not

## Done

- `@tahti-player/ui` primitives (PlayerBar, Pagination, DialogXClose, PluginItem, MediaArtwork, TrackTable, NewsWidget, CardsRow, QueueItem, TopBarNavigation, TahtiJam, HistoryRow, LogDateRangeFilter, PlayerWorkspace, SettingsPanel, ThemeStoreItem)
- Listener + chrome (ConnectedPlayerBar through ScheduleDialog / WidgetCard / lightbox)
- **Studio** — ProEditor, CollectionEdit, ChannelDesigner, Studio list/detail views, channel panels, TrackEditDialog, StreamManager, ArtistGallery, StashFiles, Theme/Track editors, MediaIconActions, and related one-offs

## Admin + Settings add-ons (remaining)

| File | Missing |
| --- | --- |
| `PluginStorePanel.tsx` | 13 |
| `AdminStreamManagerPanel.tsx` | 9 |
| `AdminStorageView.tsx` | 7 |
| `AdminAgmView.tsx` | 4 |
| `AdminDiscoWidgetsView.tsx` | 3 |
| `AdminMissedShowsView.tsx` | 3 |
| `AdminNewsView.tsx` | 2 |
| `SelectsTab.tsx` | 2 |
| `AdminUserEditPanel.tsx` | 3 |
| `DiscoWidgetManagerPanel.tsx` | 3 |
| `SettingsPanels.tsx` | 5 |
| `AdminAnnouncementsView.tsx` | 1 |
| `AdminFinancialView.tsx` | 1 |
| `AdminGrantsView.tsx` | 1 |
| `AdminI18nView.tsx` | 1 |
| `AdminStorageUserView.tsx` | 1 |
| `PinnedAnnouncementsPanel.tsx` | 2 |
| `DiscordBotAddonCard.tsx` | 1 |

## Order of work

1. ~~UI primitives.~~
2. ~~App chrome.~~
3. ~~Listener hubs + remaining listener.~~
4. ~~Studio toolbars + panels.~~
5. Admin stream manager + storage + PluginStorePanel.
6. Remainder. Re-run the scan; target **0** icon `Button`s without a wrapping `Tooltip`.

After wrapping, drop redundant native `title=` when `Tooltip` + `aria-label` already say the same thing.
