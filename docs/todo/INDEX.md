# docs/todo — open work index

Agents: read this file instead of listing or skimming all of `docs/todo/`.  
When a task is finished → fold into [`HISTORY.md`](HISTORY.md), delete the todo file, update this index, and remove finished checkboxes from `WORKPLAN.md` / other active trackers.

Status values: `open` | `blocked` | `partial`.

| Status | File | One-line |
| --- | --- | --- |
| open | [ci-snapshot-digest.md](ci-snapshot-digest.md) | CI Vitest snapshot digest / PR comment |
| partial | [channel-designer-background-section-fixes.md](channel-designer-background-section-fixes.md) | Designer background section; design decision remains |
| partial | [channel-designer-links-prefill-and-home-rename.md](channel-designer-links-prefill-and-home-rename.md) | Links prefill / home rename; flagged sub-asks |
| partial | [channelview-badge-dedup-and-share-modal.md](channelview-badge-dedup-and-share-modal.md) | Badge dedup + share modal leftovers |
| open | [desktop-pro-library.md](desktop-pro-library.md) | Independent desktop player / library / Soulseek |
| partial | [go-live-header-subtext-cleanup.md](go-live-header-subtext-cleanup.md) | Calendar view restore still open |
| open | [governance-motion-parity.md](governance-motion-parity.md) | Member governance vs prod dashboard parity |
| partial | [help-keyboard-navigation.md](help-keyboard-navigation.md) | Settings remapping deep link still open |
| partial | [help-layer-component-port.md](help-layer-component-port.md) | Port shipped; other queued help work |
| partial | [image-upload-hover-lightbox.md](image-upload-hover-lightbox.md) | Shared chrome done; remaining surfaces |
| partial | [local-files-moved-to-library-tab.md](local-files-moved-to-library-tab.md) | Move done; desktop-mode gating open |
| blocked | [map-screenshot-refresh.md](map-screenshot-refresh.md) | Signed-in recapture blocked post-ViewShell |
| open | [plugin-registry-extraction.md](plugin-registry-extraction.md) | Pointer to sibling extraction checklist |
| open | [pr2-merge-ready.md](pr2-merge-ready.md) | Keep PR #2 merge-ready |
| open | [queued-ux-fixes-2026-09-05.md](queued-ux-fixes-2026-09-05.md) | Queued UX: 4 open (artwork, catalog, designer tabs) |
| partial | [radio-browser-directory-fixes.md](radio-browser-directory-fixes.md) | Cover-image sub-ask needs decision |
| partial | [storybook-ui-sweep.md](storybook-ui-sweep.md) | Sweep executed; follow-ups continue |
| partial | [stream-overlay-auto-fill-and-avatar-placeholder.md](stream-overlay-auto-fill-and-avatar-placeholder.md) | Now-playing artwork remaining |
| partial | [stream-overlay-text-color.md](stream-overlay-text-color.md) | Opacity/scrim toggle remaining |
| partial | [studio-storybook-sweep.md](studio-storybook-sweep.md) | Remaining Studio primitive swaps |
| partial | [viewshell-page-headers.md](viewshell-page-headers.md) | Cover-overlay Studio entity headers excluded |

## Fold rule (copy into CLAUDE / chat)

```
Done task → append summary to docs/todo/HISTORY.md → delete docs/todo/<file>.md
         → remove row from INDEX.md → strip finished items from WORKPLAN.md
Never leave **Status:** done files in docs/todo/.
```
