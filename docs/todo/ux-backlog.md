# UX and design-system backlog

**Status:** open

One place for the open UI/UX polish work. Consolidates (2026-10-20):
`ux-sweep-30-slices.md`, `ux-sweep-batch-4.md`, `ux-sweep-batch-91-120.md`,
`catalog-components-empty-states.md`, `listen-ui-liveliness.md`,
`ambient-waveform-track-rows.md`, `view-modes-track-tables.md`,
`profile-surfaces-unification.md`, `studio-artist-usability.md`. What those
shipped is in HISTORY (empty states, filters, shared library rows, profile
sections, collection track list, Studio undo). Audits still being worked on
keep their own files:
[navigation-flow-audit.md](navigation-flow-audit.md),
[ui-nav-audit.md](ui-nav-audit.md), [channel-page-redesign.md](channel-page-redesign.md).

Rule of thumb: library components only (`@tahti-player/ui`), Storybook story per
new surface, one PR per row. After moving files, update `docs/VIEW-CATALOG.md`.

## Liveliness

- [ ] De-green `Button` (primary-heavy everywhere; Cards and the MediaArtwork
  overlay were already neutralised). Partial: Governance attention panel +
  stream PlaylistDialog selected row (batch 81).
  - 2026-11-03 (de-green 20): `ConfirmDialog` takes `destructive` (red
    confirm). Deletes, removals, revokes, blocks, sign-outs, disconnects,
    withdrawals and cancellations now confirm in red on Studio sounds,
    devices, artist and DM block, smart and local playlists, track /
    discussion / motion comments, social disconnects, API token and share
    link revoke, admin storage, admin news and announcements, admin add-ons,
    governance withdrawals, subscription / party / episode / venue show
    cancel, board term end, agenda and meeting records, saved map comments,
    gallery and image-slot removes, and the Pro editor mastering remove.
    Stop stream, Overwrite rotation, Replace rotation (stream manager and
    Selects) and Overwrite live version are red. Log toolbar Clear and Open
    log folder, the plugin store Installed state and the email-change Back
    to Settings are secondary.
  - 2026-11-03 (de-green 15): red confirms on artwork presets, multistream
    and multicast destination removes, channel moderators, chat message
    remove and ban, stash file delete, duplicates remove and merge, desktop
    library track remove and stop watching, Library media, Jam guests,
    pinned announcements, disco widgets, broadcast key reset, channel
    comments and listening-history clear.
  - Left: confirms still green - radio presets, plugin-store categories,
    theme submissions. Pass `destructive` to each.
  - 2026-11-04: de-greened Studio events, updates (send + delete), editor
    project delete, playlist editor remove/cover, collection editor dialogs,
    release detail delete/artwork, release smart-link track remove.
  - 2026-10-30: quieted jumps that were sitting next to a real action
    or beside an already-secondary control: smart-link empty Create
    release, container logs, back to the channel, Pro editor, gallery
    Done, Go Live to record, A/B switch, and the channel live-chat
    notice. Saves, plays, uploads, and empty-state setup (Stripe, tiers)
    stay green.
  - 2026-10-30 (batch 120): add-on Reject is danger; Open Storybook and the
    MusicBrainz "open prefilled editor" links are secondary. Primary
    confirms (Rename, Add to queue, Play, Download) stay green.
  - 2026-10-30 (batch 117): channel announcement confirm Delete and Cancel
    the election use danger; the selects picker Cancel and the download
    gate Copy link use secondary. Primary actions on those screens stay.
  - 2026-10-27: Settings → Add-ons import cards - per-row Import (Bandcamp
    albums, SoundCloud tracks), the hearthis.at Search submit and the
    disabled Soulseek "Desktop only" are `secondary`; Connect / Import all /
    Import selected stay primary.
  - 2026-10-27: Studio list views - per-row Edit / Send / open-in-editor and
    the empty-state duplicate of the header "+" are `secondary`; the header
    "+" and dialog submits stay primary (Playlists, Collections, Releases,
    Editor, Updates).
