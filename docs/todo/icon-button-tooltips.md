# Icon-button Tooltip sweep

**Status:** done for listed surfaces (2026-09-04). Re-scan before claiming absolute 0.
**Storybook:** `Components/Tooltip` → `SidebarIcons`.

Every icon-only control must use Storybook `Tooltip` for the hover/focus label. Keep `aria-label` for assistive tech. Do not treat native `title=` as the tooltip.

```tsx
<Tooltip content="Configure visualizer" side="top">
  <Button size="icon-sm" aria-label="Configure visualizer">
    <SettingsIcon size={15} aria-hidden />
  </Button>
</Tooltip>
```

## Done

- `@tahti-player/ui` primitives
- Listener + chrome
- Studio toolbars + panels
- **Admin + Settings add-ons** — PluginStorePanel, AdminStreamManager, Storage, AGM, Disco widgets, Missed shows, News, Selects, User edit, DiscoWidgetManager, SettingsPanels, Announcements/Financial/Grants/I18n/StorageUser, PinnedAnnouncements, DiscordBotAddonCard

## Follow-up

Re-run an icon-button scan across `packages/tahti-web` for any remaining `size="icon"` / `size="icon-sm"` without a wrapping `Tooltip`. Drop redundant `title=` when Tooltip + aria-label already say the same thing.

**2026-09-05 re-scan:** widened the earlier scan's context window (raw
`content={...}` props on `Tooltip` often span 10+ lines above the button,
which produced false positives at first). One real gap found, and it was
systemic rather than a single call site: `@tahti-player/ui`'s `CopyButton`
(icon-only by default, `size="icon-sm"`) never wrapped itself in `Tooltip`
— all 9 call sites across `tahti-web` relied on `aria-label` alone, and 3
also carried a redundant native `title=`. Fixed in the shared component
(`CopyButton.tsx` now wraps its `Button` in `Tooltip`, deriving the label
from `aria-label` ?? `title` ?? `'Copy'` so every existing and future call
site gets a tooltip for free); dropped the now-redundant `title=` at the 3
call sites that had one (`StudioReleasesView`, `AdminAgmView`,
`MusicBrainzSubmissionAssistant`). Snapshot updated
(`CopyButton.test.tsx.snap`); all 3 `CopyButton` tests pass;
`type-check` clean on `@tahti-player/ui` and `@tahti-player/tahti-web`.
