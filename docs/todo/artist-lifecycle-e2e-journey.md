# Artist lifecycle e2e journey (register → catalog → fans → 20m live)

**Status:** partial

## Ask

Review existing e2e/journey coverage, then run an end-to-end artist path with screenshots and flag UX/bugs.

## Done

- Gap review vs `artist-journey.mjs` / `real-user-journeys.spec.ts` / fan-sub specs.
- Added `scripts/journeys/artist-lifecycle-journey.mjs`.
- Ran full path against mock (`:5190`), **20-minute** stream wait with shots at 0/5/10/15/20.
- Artifacts: `packages/tahti-web/docs/e2e-journeys/artist-lifecycle/` (50 PNGs + `ISSUES.md`).
- Fixed stale Username fill in `e2e/real-user-journeys.spec.ts`.
- Documented runner in `docs/E2E-JOURNEYS.md`.

## Top findings (see ISSUES.md)

1. **P0** Mock live drops after reload/navigation — fan ends on OFFLINE.
2. **P1** Dual upload UI (page staging + empty modal).
3. **P1** Collections “Design” opens an existing mock album, not the one just created.
4. **P1** Fans get comments (“Post comment”), not live chat.
5. **P2** Channel designer defaults to Green room; Go Live checklist vs live state mismatch; deep nested Broadcast tabs.

## Left

- Fix via filed todos (INDEX):
  - [mock-live-session-survives-reload.md](mock-live-session-survives-reload.md) (P0)
  - [upload-dual-ui-unify.md](upload-dual-ui-unify.md) (P1)
  - [collections-design-opens-created.md](collections-design-opens-created.md) (P1)
  - [fan-live-chat-discoverable.md](fan-live-chat-discoverable.md) (P1)
  - [artist-lifecycle-p2-ux.md](artist-lifecycle-p2-ux.md) (P2)
- Optionally re-run the journey after those land.
