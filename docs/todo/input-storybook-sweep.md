# Input Storybook sweep (embedded search/filter icons)

**Status:** planned (not started).

Worklog: `packages/tahti-web/UI-REDESIGN-WORKLOG.md`
(2026-09-04 — Input Storybook sweep).

WORKPLAN: medium-priority Storybook backlog.

## Goal

Every text-like field in tahti-web should be Storybook `Input` (or the
matching primitive: `Textarea`, `Select`, `CreatableCombobox`, `Slider`,
`Toggle`, `FilePicker`) when that component already covers the job. Search
and filter fields embed the icon **in** the field (`startAddon` /
`endAddon`), not as a sibling button or an absolutely positioned overlay.

## Storybook contract

`Components/Input` (`packages/storybook/src/Input.stories.tsx`):

- `startAddon` — quiet left slot (`WithStartAddon`). Use for **search**
  (`SearchIcon`).
- `endAddon` — right slot (`WithEndAddon` uses `FilterIcon`). Use for
  **filter** affordances, or a compact submit/clear control that belongs
  inside the field.
- `type="search"` + `size="sm"` for list filters. Submit on Enter; drop a
  labeled Search `Button` next to the field when the icon is already in
  the input.

Do not fake an addon with `relative` + `absolute` icon + `pl-9`. That is
the current Help / Admin Users / Top lists / Storage pattern.

## Already using Input + addon (leave as reference)

- `StudioRecordingsView`, `StudioCollectionEditView` (track search)
- Admin moderation `SupportTab`, `SelectsTab` (`endAddon` `SearchIcon`)

Prefer migrating those search addons to **`startAddon`** so search looks
the same everywhere (`endAddon` is primary-colored; search should stay
quiet). Filter-as-suffix can stay `endAddon` `FilterIcon`.

## Overlay / sibling icon (swap to addon)

| Surface | Today |
| --- | --- |
| Help guide index | `SearchIcon` absolute + `pl-9` |
| Admin Users | same |
| Admin Top lists | same |
| Admin Storage files | same |
| Studio Release detail add-track | `SearchIcon` / `FilterIcon` sitting beside `Input` |
| PluginStore Radio Browser + HearThis + personal stream | labeled Search `Button` with `SearchIcon` |
| Global search | `Input` `type="search"`, no icon; clear is an overlay `Button` — keep clear, add `startAddon` Search |

## `Input` without an icon (add when it is a search/filter)

Listen artists, Studio Sounds archive, Disco-widget store, collections
(Studio + My), discography, releases panel, editor library search, and
any other `placeholder="Search…"` field. URL/name/email/password fields
do **not** get a search icon.

## Native `<input>` leftovers (replace where applicable)

Hand-styled text/date still in Feature Requests comments, Theme Editor
hex, Studio Sounds “Uploaded to” date (the “from” field is already
`Input type="date"`), Governance, TracklistEditor, Onboarding, Broadcast
preflight, Channel Designer, Track detail, Sound share links.

**Leave native:**

- Hidden inputs (forms, MusicBrainz POST)
- File inputs under the media-upload convention (`ArtistGalleryPanel`,
  `StudioBrandingView`, `RoundImageUploadButton`, `RadioStationCover`,
  Channel Designer media)
- `type="color"` in Theme Editor until a Storybook color field exists
- `type="range"` → already tracked as `Slider` (`StudioProEditorView`)
- Discord bot add-on files (out of this sweep unless asked)

## Suggested slices

1. Canonical search: Help + Admin Users/Top lists/Storage overlays →
   `startAddon` `SearchIcon`. Add an Input story `WithSearchIcon` if the
   Help overlay is the only visual we still demo.
2. List filters without icons: Listen artists, Sounds, collections,
   discography, releases, Disco widgets, editor library.
3. Drop sibling Search buttons in PluginStore (Radio Browser is also in
   `docs/todo/radio-browser-addon-store.md` — same Input rule).
4. Remaining native text/date → `Input`; comment boxes → `Input` or
   `Textarea`. Skip file/hidden/color as above.
5. Align existing `endAddon` search icons to `startAddon`.
