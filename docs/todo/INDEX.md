# docs/todo — open work index

Agents: read this file instead of listing or skimming all of `docs/todo/`.  
When a task is finished → fold into [`HISTORY.md`](HISTORY.md), delete the todo file, update this index, and remove finished checkboxes from `WORKPLAN.md` / other active trackers.

Status values: `open` | `blocked` | `partial`.

| Status | File | One-line |
| --- | --- | --- |
| partial | [mobile-player-nav-and-tahti-theme-visuals.md](mobile-player-nav-and-tahti-theme-visuals.md) | Mobile player+nav stack shipped; thumbnail glow + Discover BgCanvas remain |
| partial | [channel-designer-background-section-fixes.md](channel-designer-background-section-fixes.md) | Designer background section; design decision remains |
| blocked | [channelview-move-player-to-stage.md](channelview-move-player-to-stage.md) | Player-in-backdrop extraction needs a design decision |
| open | [desktop-pro-library.md](desktop-pro-library.md) | Independent desktop player / library / Soulseek |
| partial | [go-live-header-subtext-cleanup.md](go-live-header-subtext-cleanup.md) | Calendar view restore still open |
| open | [fullscreen-player-background-translucent-layer.md](fullscreen-player-background-translucent-layer.md) | Fullscreen player: match background art translucent layer to title card treatment |
| open | [fullscreen-player-topbar-and-back-arrow.md](fullscreen-player-topbar-and-back-arrow.md) | Fullscreen player: hide top bar, replace minimize icon with big back arrow top-left |
| open | [governance-gap-list.md](governance-gap-list.md) | Governance features missing from tahti-player (18 gaps vs tahti-org) |
| blocked | [governance-out-of-account-section.md](governance-out-of-account-section.md) | Studio governance is artist/board-only; removing Account's would strand regular members — needs a decision |
| partial | [image-upload-hover-lightbox.md](image-upload-hover-lightbox.md) | Shared chrome done; remaining surfaces |
| partial | [local-files-moved-to-library-tab.md](local-files-moved-to-library-tab.md) | Move done; desktop-mode gating open |
| open | [listener-purchase-flow.md](listener-purchase-flow.md) | Listener register → buy/subscribe → see purchases & manage subscriptions in account; e2e |
| open | [pay-what-you-want-pricing.md](pay-what-you-want-pricing.md) | PWYW pricing option for fan subs/purchases with default pre-filled price |
| open | [onboarding-cta-not-forced-redirect.md](onboarding-cta-not-forced-redirect.md) | Stop force-redirecting new sign-ins to /onboarding; make it an opt-in CTA instead |
| open | [plugin-registry-extraction.md](plugin-registry-extraction.md) | Pointer to sibling extraction checklist |
| open | [queued-ux-fixes-2026-09-05.md](queued-ux-fixes-2026-09-05.md) | Queued UX: 3 open, all blocked/scoped-out (artwork backend, designer tabs feature) |
| partial | [radio-browser-directory-fixes.md](radio-browser-directory-fixes.md) | Cover-image sub-ask needs decision |
| partial | [stream-overlay-auto-fill-and-avatar-placeholder.md](stream-overlay-auto-fill-and-avatar-placeholder.md) | Now-playing artwork remaining |
| partial | [stream-overlay-text-color.md](stream-overlay-text-color.md) | Opacity/scrim toggle remaining |
| partial | [studio-emptystate-remaining.md](studio-emptystate-remaining.md) | Inline form hints + Settings-scope empties remain |
| open | [tahti-cli-tool.md](tahti-cli-tool.md) | CLI (gumroad-cli-inspired) wrapping api-client — list library items, maybe TUI player |
| partial | [viewshell-page-headers.md](viewshell-page-headers.md) | Cover-overlay Studio entity headers excluded |

## Fold rule (copy into CLAUDE / chat)

```
Done task → append summary to docs/todo/HISTORY.md → delete docs/todo/<file>.md
         → remove row from INDEX.md → strip finished items from WORKPLAN.md
Never leave **Status:** done files in docs/todo/.
```
