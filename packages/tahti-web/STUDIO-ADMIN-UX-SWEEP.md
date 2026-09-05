# Studio/Admin UX sweep (2026-09-03)

Full audit of every Studio and Admin view + subtab (34 `views/studio/*.tsx`, 27
`views/admin/*.tsx`, plus moderation/orphan tabs — ~68 files) against the design
system. **Archive / file:line table only.**

**Open punch list (use this first):** [`STUDIO-ADMIN-UX-SWEEP-OPEN.md`](STUDIO-ADMIN-UX-SWEEP-OPEN.md).
Leaf tracking: [`docs/todo/INDEX.md`](../../docs/todo/INDEX.md).
WORKPLAN epics: [`WORKPLAN.md`](WORKPLAN.md).


**Two items were explicitly called out as must-fix targets, not just
nice-to-haves:** every real action `Button` should carry a lucide icon, and
static explanatory help text should not sit permanently in the page body —
it belongs behind the existing `Tooltip` "?" badge pattern (see
`ChannelDesigner.tsx`'s "About this preview" badge for the reference
implementation: a `size-4` circular bordered "?" trigger, `Tooltip`
`side="bottom"`, content wrapped in `<p className="max-w-64 text-xs
leading-relaxed">`).

## Cross-cutting patterns (fix the pattern, not each instance)

These recur 3+ times across unrelated files, which means the real fix is a
shared component/convention, not per-file patches:

1. **Action buttons with no icon** — by far the largest category (~70
   instances below). Nearly every approve/reject/save/publish/delete/add
   button in Admin moderation tabs and several Studio views is text-only,
   even in files that already import lucide icons for other buttons on the
   same page. Mechanical fix once a per-button icon is chosen.
2. **Inline static help text instead of a Tooltip** — explanatory
   paragraphs (not data, not validation errors) sitting permanently in the
   page body near a heading or form field. ~15 instances.
3. **Hand-rolled "card" divs duplicating `StudioPanel`** — at least 5
   distinct copy-pasted variants of `StudioPanel`'s own recipe
   (`border-border bg-background-secondary/NN rounded-{lg,xl} border p-{3,4,5}
   shadow-sm`) with the opacity/radius/padding numbers drifted apart across
   files. ~15 instances.
4. **`PageEmpty`/`PageError` exist but are barely used** — nearly every Admin
   view's empty/error state is a hand-rolled `<p>`, despite `PageLoading`
   (the third state in the same file) being used correctly everywhere. ~20
   instances, almost entirely in Admin.
5. **Four different tab/segmented-control implementations** coexist with no
   canonical choice: the `Tabs` component, `Button variant="text" role="tab"`
   in a bordered nav, raw styled `<Link role="tab">`, and raw `<button>`
   groups with manually toggled `border-primary bg-primary/15` classes (this
   last one alone appears in 6+ Studio files: range pickers, mode toggles,
   type chips — several are near-verbatim duplicates of each other, e.g.
   `StudioStatsView`/`StudioStatsDetailView`'s date-range picker). No shared
   `Toggle`/segmented-control primitive exists for the button-group case —
   this may need a new component, not just a swap.
6. **`toast` vs. a local `msg`/`message` state rendered as a raw `<p>`** for
   the same kind of transient outcome — sometimes both patterns appear in
   the *same file* (`StudioDistributionView`, `StudioGoLiveView`,
   `StudioModerationView`, `StudioEditorListView`, `StudioCollectionsView`,
   `StudioPlaylistsView`, `StudioReleasesView`). Consolidate on `toast` for
   transient feedback.
7. **Hand-rolled status-pill `<span>`** duplicating `Badge` — rare (2
   instances), most files already use `Badge` correctly.

## Findings by file

Table columns: `file:line | category | description | suggested fix`.
Categories: `missing-icon`, `inline-help-text`, `hand-rolled-card`,
`hand-rolled-loading-state` (empty/error), `hand-rolled-badge`, `tab-drift`,
`toast-drift`, `other`.

### Studio views

| file:line | category | description | suggested fix |
|---|---|---|---|
| StudioBrandingView.tsx:409-411 | inline-help-text | "JPEG, PNG, or WebP. The original is kept for full-size use." always-visible caption | Tooltip |
| StudioChannelView.tsx:196-199 | missing-icon | "Create {username}.tahti.live" create action | icon |
| StudioCollectionEditView.tsx:634-636 | hand-rolled-badge | `{n} images` count pill | Badge |
| StudioCollectionsView.tsx:178,300-317 | toast-drift, hand-rolled-loading-state | ad-hoc `msg` `<p>`; two hand-rolled empty states | toast; PageEmpty |
| StudioDistributionView.tsx:196-227 | hand-rolled-card | `GuideDetail` bordered div duplicates StudioPanel | StudioPanel |
| StudioDistributionView.tsx:241,334,674,778 | toast-drift | raw `<p>` for `msg` | toast |
| StudioDistributionView.tsx:411-437,793-802 | other | raw `<button>` bypasses `Button` entirely | Button |
| StudioDistributionView.tsx:680-683 | inline-help-text | always-visible Revelator explanation | Tooltip |
| StudioEditorListView.tsx:127-131,178-193 | toast-drift, hand-rolled-loading-state | raw `<p role="status">`; hand-rolled empty state | toast; PageEmpty |
| StudioEditorProjectView.tsx:153-157 | hand-rolled-loading-state | raw error `<p role="alert">` | PageError |
| StudioEventCreateView.tsx:116-120 | hand-rolled-loading-state | raw form-error `<p role="alert">` | PageError |
| StudioEventsView.tsx:80-94 | missing-icon | "Remove" event, real delete action | Trash2Icon |
| StudioGoLiveView.tsx:475-484 | inline-help-text | permanent OBS setup instructions | Tooltip |
| StudioGoLiveView.tsx:325-336 vs 675-679 | toast-drift | ad-hoc alert styling alongside real `toast.success/error` in same file | toast |
| StudioGoLiveView.tsx:568-578 | missing-icon | multicast "Disable"/"Enable" toggle | power/toggle icon |
| StudioGovernanceView.tsx:40-58 | tab-drift | raw styled `<Link role="tab">` — 3rd distinct tab-nav variant | Tabs |
| StudioHomeView.tsx:488-587 | hand-rolled-card | governance section box duplicates StudioPanel's title+action shape | StudioPanel |
| StudioHomeView.tsx:353-360 | other | raw `<button>` styled as a link instead of `Button variant="text"` | Button |
| StudioModerationView.tsx:78,141,205 vs 207,275 | toast-drift | raw `<p>` for errors, `toast.success` for success in same file | toast |
| StudioPlaylistsView.tsx:114-123 | tab-drift | two plain Buttons + manual `aria-current` — 4th tab-nav variant | Tabs |
| StudioPlaylistsView.tsx:167-169,245,566-567,594-595 | missing-icon | Create/Edit/Add track/Add release, all text-only | PlusIcon/PencilIcon |
| StudioProEditorView.tsx:962-987,1443-1448 | missing-icon | split-stem action; save-revision dialog buttons | icon |
| StudioProEditorView.tsx:1354-1375 | other | "Slope" chips hand-rolled while "Mode" above uses `FilterChips` | FilterChips |
| StudioRecordingsView.tsx:172-176 | missing-icon | "Publish" draft row action | UploadCloudIcon |
| StudioReleaseDetailView.tsx:159-164 | hand-rolled-loading-state | "Release not found" ad-hoc | PageEmpty/PageError |
| StudioReleaseDetailView.tsx:235-243 | missing-icon | "Change artwork" — raw `<button>`, not `Button` at all | Button + icon |
| StudioReleaseDetailView.tsx:319-335,733-739 | missing-icon | "Publish"; "Fill all" | icon |
| StudioReleaseDetailView.tsx:374-376 | inline-help-text | fingerprinting explanation in StudioPanel `description` prop | Tooltip |
| StudioReleasesView.tsx:129,186-200 | toast-drift, hand-rolled-loading-state | ad-hoc `msg`; hand-built empty state | toast; PageEmpty |
| StudioReleasesView.tsx:209-231 | missing-icon | "Edit" row action | PencilIcon |
| StudioReleasesView.tsx:296-325 | tab-drift | `TypeChip` hand-rolled segmented control | Toggle |
| StudioRevenueView.tsx:124-144 | hand-rolled-card | nested empty-state box inside a StudioPanel | PageEmpty |
| StudioRevenueView.tsx:148-164 | other | hand-rolled red alert banner (no shared Alert component exists) | shared Alert/Banner (new) |
| StudioScheduleView.tsx:152-193,194-200 | hand-rolled-card, hand-rolled-loading-state | raw bordered section instead of StudioPanel; hand-built empty text | StudioPanel; PageEmpty |
| StudioScheduleView.tsx:225-229 | hand-rolled-badge | "Fans only" hand-styled uppercase span | Badge |
| StudioScheduleView.tsx:792-798,986-1008 | missing-icon | "Cancel" episode; "Stop recurring"/"Save weekly schedule" | icon |
| StudioScheduleView.tsx:980-983 | inline-help-text | weekly-recurrence sentence in dialog body | Tooltip |
| StudioShowDetailView.tsx:375-378 | hand-rolled-loading-state | "Show not found" ad-hoc | PageEmpty/PageError |
| StudioShowDetailView.tsx:402-442 | tab-drift | custom `role="tablist"` from `Button size="xs"` | Tabs |
| StudioShowDetailView.tsx:517-525,668-671 | missing-icon | "Book next Nh slot"; "Play recording" (Play is icon-only elsewhere) | CalendarPlusIcon; PlayIcon |
| StudioShowDetailView.tsx:727-753 | tab-drift | "Upload audio / Record" hand-rolled toggle | Toggle |
| StudioShowDetailView.tsx:913-916 | hand-rolled-card | raw `<section>` instead of StudioPanel | StudioPanel |
| StudioShowsView.tsx:186-220 | tab-drift | show-mode / interval-hours hand-rolled pickers | Toggle |
| StudioShowsView.tsx:236-250 | hand-rolled-loading-state | "No shows yet" hand-built | PageEmpty |
| StudioSoundsView.tsx:380-388 | other | raw `<input type="date">` next to a sibling field correctly using `Input` | Input |
| StudioSoundsView.tsx:404-409 | hand-rolled-loading-state | "No tracks yet" hand-built | PageEmpty |
| StudioSoundView.tsx:505-525 | other | two hand-rolled status/alert boxes (processing/failed) | shared Alert/Banner (new) |
| StudioStashView.tsx:43-66 | tab-drift | hand-rolled `role="tablist"` from `Button role="tab"` | Tabs |
| StudioStashView.tsx:70-80 | hand-rolled-card | raw section duplicates StudioPanel's title/description slots | StudioPanel |
| StudioStatsDetailView.tsx:68-88 / StudioStatsView.tsx:259-280 | tab-drift | near-identical range-picker duplicated verbatim across two files | Toggle (shared) |
| StudioStatsView.tsx:283-304 | tab-drift | hand-rolled tablist (Tabs used correctly elsewhere in same codebase) | Tabs |
| StudioStatsView.tsx:393-445 | tab-drift | two more hand-rolled segmented groups — 4 variants in one file | Toggle |
| StudioStripeView.tsx:115-139 | missing-icon | "Start/resume onboarding" (contrast: nearby Connect button in StudioUploadView uses PlugIcon) | icon |
| StudioStripeView.tsx:184-194 | inline-help-text | payout-schedule paragraph at bottom of page | Tooltip |
| StudioUploadView.tsx:387-420 | hand-rolled-card | two raw bordered panels (dropzone, recordings list) | StudioPanel |
| StudioUploadView.tsx:398-402 | inline-help-text | metadata-extraction explanation by file picker | Tooltip |
| StudioVenuesView.tsx:313-315 | hand-rolled-loading-state | "No venues yet", no card wrapper at all | PageEmpty |

Clean, no findings: `StudioMasteringView.tsx`, `StudioSetupChannelRedirect.tsx`,
`StudioTrackInsightsView.tsx`, `StudioUpdatesView.tsx`, `StudioSoundView.tsx`
(otherwise), `StudioVenuesView.tsx` (otherwise) — good reference examples.

### Admin views + moderation/orphanPages tabs

| file:line | category | description | suggested fix |
|---|---|---|---|
| AdminActivityView.tsx:179-190 | inline-help-text | count + static explanation mixed in one paragraph | Tooltip (split from the live count) |
| AdminAgmView.tsx:71-110 | other | raw `↑`/`↓`/`×` glyphs instead of lucide icons | ChevronUp/ChevronDown/XIcon |
| AdminAgmView.tsx:208-226,410-433 | missing-icon | "Create meeting"; "Add document" | Plus/SaveIcon |
| AdminAgmView.tsx:333-351 | hand-rolled-card | `<details>` wrapper duplicates StudioPanel's className verbatim | StudioPanel (disclosure variant) |
| AdminAgmView.tsx:326-330 | inline-help-text | advisory-status disclaimer next to list | Tooltip |
| AdminAnnouncementsView.tsx:97-101 | inline-help-text | "Turning this off stops all system announcements…" inside a StudioPanel | Tooltip |
| AdminAnnouncementsView.tsx:220-234 | missing-icon | "Delete" | Trash2Icon |
| AdminArtworkPresetsView.tsx:142-144,213 | missing-icon | "Reset to defaults"; "Save presets" | RotateCcw/SaveIcon |
| AdminArtworkPresetsView.tsx:168 | hand-rolled-card | bespoke card, doesn't match StudioPanel's own recipe either | StudioPanel |
| AdminDashboardView.tsx:130-134 | hand-rolled-card | dialog note box near-duplicates StudioPanel styling inline | StudioPanel / shared "note" pattern |
| AdminDiscoWidgetsView.tsx:318-321 | hand-rolled-card | widget list `<article>` duplicates StudioPanel | StudioPanel |
| AdminDiscoWidgetsView.tsx:167-180 | missing-icon | "Save changes"/"Register widget" | Save/PlusIcon |
| AdminFinancialView.tsx:146-171 | missing-icon | "Save entry" | SaveIcon |
| AdminGovernanceView.tsx:176-199,202-243 | hand-rolled-card | stat tiles (3rd card-recipe variant, `/35` `rounded-lg`); activity table wrapper | StudioPanel |
| AdminGovernanceView.tsx:244-254,258-261 | inline-help-text | attribution note; resolution-vs-motion explanation | Tooltip |
| AdminGovernanceView.tsx:305-334,348-369 | missing-icon | "Record resolution"; "Publish" | Save/PlusIcon; UploadIcon |
| AdminGrantCycleView.tsx:130-181 | other | mixes `SectionShell` (@tahti-player/ui) and `StudioPanel` on one page | pick one (prefer StudioPanel) |
| AdminGrantCycleView.tsx:192-198 | missing-icon | "Approve distribution" | CheckIcon |
| AdminGrantsView.tsx:70-77 | other | raw `→` glyph instead of icon | ArrowRightIcon |
| AdminGrantsView.tsx:85-88 | inline-help-text | dry-run/approval explanation | Tooltip |
| AdminI18nView.tsx:144-151,198-203 | missing-icon | "Import CSV"; "Add language" | Upload/PlusIcon |
| AdminLogsView.tsx:108-116 | other | ad-hoc red alert box, no shared Alert component | shared Alert/Banner (new) |
| AdminMissedShowsView.tsx:100,101-104 | hand-rolled-loading-state | ad-hoc error `<p>`; "No missed shows" | PageError; PageEmpty |
| AdminNewsView.tsx:106-120 | hand-rolled-loading-state | hand-rolled empty state with manual action button instead of `PageEmpty`'s `action` prop | PageEmpty |
| AdminNewsView.tsx:332-356,357-380 | missing-icon | "Save as draft"; "Publish" dialog buttons | icon |
| AdminRadioView.tsx:181-209,310-316,517-548,575-589 | missing-icon | Enable/Disable, Edit, Remove, Add/Save, Move to front, Opt out, Re-enable — 8 buttons, all text-only (contrast: this file's icon-only edit buttons elsewhere are fine) | icons throughout |
| AdminRadioView.tsx:251-253 | inline-help-text | "Hover to replace" caption under Dialog image | Tooltip or Input `description` |
| AdminRadioView.tsx:138-140,478-481,496-499,597-600 | hand-rolled-loading-state | four separate hand-rolled empty states | PageEmpty |
| AdminReportsView.tsx:48-69,75-78 | missing-icon, hand-rolled-loading-state | "Generate report"; hand-rolled empty state | FileTextIcon; PageEmpty |
| AdminStatusView.tsx:66-69 | hand-rolled-loading-state | "Could not load status" | PageError |
| AdminStorageUserView.tsx:57-62,107-110 | hand-rolled-loading-state | load error; "No files uploaded yet" | PageError; PageEmpty |
| AdminStorageView.tsx:456-463,320-326,515-518,800-803,846-849 | hand-rolled-loading-state | load error + 4 separate empty states across sub-tabs | PageError; PageEmpty |
| AdminStreamsView.tsx:12-15 | inline-help-text | subtitle doubles as button-behavior documentation | Tooltip, keep subtitle short |
| AdminTopListsView.tsx:160-167 | hand-rolled-loading-state | two-variant bare-`<p>` empty state | PageEmpty |
| AdminTopListsView.tsx:36-70 | tab-drift | custom `FilterRow` segmented group reimplements a pill tab bar | Tabs/ModerationTabs |
| AdminUsersView.tsx:96-98 | hand-rolled-loading-state | "No users match these filters" | PageEmpty |
| AdminUsersView.tsx:103-127 | other | hand-rolled selectable-list buttons, manual `aria-pressed` | shared list/tab primitive |
| AdminVenuesView.tsx:88-90,93-96 | hand-rolled-loading-state | ad-hoc error; "No venues found" | PageError; PageEmpty |
| moderation/tabs/BetaTab.tsx:169-186,192-206 | missing-icon | Approve/Reject row actions; "Resend setup link" | Check/XIcon; SendIcon |
| moderation/tabs/ContentReportsTab.tsx:81-104 | missing-icon | Start review/Mark actioned/Dismiss | Eye/Check/XIcon |
| moderation/tabs/FeatureRequestsTab.tsx:93-119 | missing-icon | Plan/In progress/Done/Decline/Reopen (icons already imported for filter tabs, unused here) | Clock3/LoaderCircle/Check/BanIcon |
| moderation/tabs/RadioSubmissionsTab.tsx:160-201 | missing-icon | "Approve to radio"/"Reject" text-only (sibling "Play" button *does* pair PlayIcon — inconsistent within same panel) | Check/XIcon |
| moderation/tabs/SupportTab.tsx:253-280,331-337 | missing-icon | Start progress/Resolve/Reopen; Reply send | Clock3/Check/RotateCcwIcon; SendIcon |
| moderation/tabs/SupportTab.tsx:163 | hand-rolled-card | toolbar wrapper — yet another `/30` `rounded-lg` card variant | StudioPanel |
| moderation/tabs/SelectsTab.tsx:454-477 | missing-icon | "Add {n} to rotation" dialog submit | PlusIcon |
| moderation/tabs/SelectsTab.tsx:447-453 | other | "Cancel" hand-styles instead of `variant="secondary"` | Button variant |
| orphanPages/tabs/RadioStationSuggestionsTab.tsx:49-52 | inline-help-text | static explanation with no PageHeader/subtitle to carry it | Tooltip, or promote to subtitle |
| orphanPages/tabs/RadioStationSuggestionsTab.tsx:64-69 | hand-rolled-loading-state | "No pending station suggestions" | PageEmpty |
| orphanPages/tabs/RadioStationSuggestionsTab.tsx:136-177 | missing-icon | Approve; Reject | Check/XIcon |

Clean, no findings: `AdminContentView.tsx`, `AdminMapView.tsx`,
`AdminSelectsView.tsx`, `AdminVendorsView.tsx` (correctly uses `StudioPanel`'s
`description` prop, not raw paragraphs), `AdminOrphanPagesView.tsx`,
`orphanPagesNav.ts`. `AdminNewsView.tsx`/`AdminStorageView.tsx` are otherwise
the most disciplined files audited (icon+text pairing done correctly for
most actions).

**Also found, not styling but worth a product decision:**
`orphanPages/tabs/SelectsTab.tsx` is fully built but not wired into
`AdminModerationView`'s tab switch (6 of 6 slots used are support / beta /
radio-submissions / content-reports / feature-requests / missed-shows —
Selects isn't among them). Confirm intentional or wire it up.

## Suggested execution order

1. **Missing icons on action buttons** (~70 instances) — mechanical, lowest
   risk, matches the user's explicit ask. Do a file-by-file pass; most files
   already import lucide icons for other buttons, so it's picking a matching
   icon per action, not adding new dependencies.
2. **Inline help text → Tooltip** (~15 instances) — same shape every time
   (the ChannelDesigner "?" badge pattern), mechanical once the pattern is
   agreed.
3. **`PageEmpty`/`PageError` adoption** (~20 instances, concentrated in
   Admin) — mechanical swap, existing components already do the job.
4. **Hand-rolled cards → `StudioPanel`** (~15 instances) — mostly mechanical,
   a few (AdminGrantCycleView's `SectionShell` mix, AdminAgmView's
   `<details>`) need a small structural decision, not just a className swap.
5. **Tab/segmented-control consolidation** (~12 instances across 4
   implementations) — needs a decision first: standardize on `Tabs`
   everywhere it fits, and evaluate whether the button-group "chip" cases
   (range pickers, mode toggles, type chips) need a new shared
   `SegmentedControl`/`Toggle`-group component, since no existing component
   currently covers that shape.
6. **`toast` consolidation** (~10 instances) — mechanical once a shared
   error-toast helper convention is picked for form-submit failures.
7. Two small missing primitives surfaced repeatedly and have no existing
   component to swap to: a shared inline **Alert/Banner** (red warning box —
   appears hand-rolled in `AdminLogsView`, `StudioRevenueView`,
   `StudioSoundView`) and a shared **SegmentedControl** (item 5). Worth
   building both once, in `@tahti-player/ui` with a Storybook story, rather
   than fixing each call site independently.
