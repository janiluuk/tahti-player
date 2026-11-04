# ConfirmDialog Finnish leftovers

**Status:** open

After batches 45–48 cleared hardcoded `toast.*(English literal)` sites in
tahti-web, Studio/Admin **ConfirmDialog** title/description/confirmLabel
copy is the next Finnish sweep. Source: toast/ConfirmDialog scout
2026-11-04 (post–batch-45).

Skip: Admin hub card English descriptions; radio widget redesign; SPA
perf; pageTour / keyboardNavigation.

## Studio

- [ ] `StudioScheduleView.tsx` — cancel scheduled episode
- [ ] `StudioUpdatesView.tsx` — send newsletter / delete post / remove newsletter
- [ ] `StudioBrandingView.tsx` — replace gallery / remove image
- [ ] `StudioEditorProjectView.tsx` — delete multitrack session
- [ ] `go-live/BroadcastCredentialsPanel.tsx` — make a new stream key
- [ ] `distribution/DeliveryTab.tsx` — submit to Revelator
- [ ] `release-detail/ReleaseSmartLinksPanel.tsx` — remove track from release
- [ ] `collection-edit/CollectionDialogs.tsx` — frame delete description leftover
- [ ] `pro-editor/MasteringPanel.tsx` — remove mastering plugin

## Admin

- [ ] `AdminNewsView.tsx` / `AdminAnnouncementsView.tsx` — delete item
- [ ] `InternetRadioPresetsPanel.tsx` — remove preset
- [ ] `storage/FilesBrowserTab.tsx` + `BulkEditBar.tsx` — permanent delete
- [ ] `AdminAddonsView.tsx` + `addons/ManageDialog.tsx` — delete/disable add-on
- [ ] `AdminArtworkPresetsView.tsx` — remove artwork ConfirmDialog (toast already i18n)
- [ ] Governance: `MeetingRecordPanels`, `AgendaItemRow`, `AnnualReportActions`

## Also (chrome empties called out with the same scout)

Schedule / Broadcast / Profile hub / Multistream panel chrome; ModerateChannel
empties; DeliveryTab royalty empties — fold into the same or next UX batch
as capacity allows. Prefer `web.actions.cancel|delete|remove|close` for
buttons.

## Ship shape

Same as recent batches: en_US + fi_FI keys, `batchNNI18n.test.ts`, bump
tahti-web patch, UI-REDESIGN-WORKLOG, fold this file when the ConfirmDialog
list above is empty.
