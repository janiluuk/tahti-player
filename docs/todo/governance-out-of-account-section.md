# Move Governance out of Settings → Account

**Status:** blocked

User request (2026-09-06): move governance out of the Account settings
section; check whether it's already implemented in Studio → Governance
— if so, remove it from Account; if not, merge it there.

## Found

Governance (`GovernanceView.tsx`) is already reachable from **three**
places:

1. `/governance` — a standalone top-level route
   (`router.tsx:1115-1119`), no `StudioGate`/role restriction. Open to
   any signed-in member (also in `AppShell.tsx`'s
   `ANONYMOUS_ALLOWED_ROUTES`).
2. Settings → Account → **Membership** tab has a "Governance" button
   linking to `/governance` (`views/settings/SettingsPanels.tsx:502-507`).
3. Settings → Account → **Governance** tab renders `<GovernanceView />`
   inline, in-modal (`SettingsPanels.tsx:511-520`).
4. `/studio/governance` — `StudioGovernanceView.tsx` wraps the exact
   same `GovernanceView` in Studio nav chrome (Motions/Topics tabs) —
   **but gated behind `StudioGate` requiring the `ARTIST` or `BOARD`
   account role** (`components/StudioGate.tsx:39`).

So yes, it's already "implemented in Studio → Governance" — but that
route excludes every regular (non-artist) cooperative member, who can
still vote on motions via `/governance` and item 1/2/3 above.

**Why Account has it at all — this looks deliberate, not leftover
clutter.** `GovernanceView` has no entry in the main sidebar or mobile
bottom nav (checked `AppShell.tsx`'s `SidebarNavItems`,
`MobileChrome.tsx`'s `NAV` — no "Governance" item in either). A prior
session's orphan-page audit (`UI-REDESIGN-WORKLOG.md`, 2026-09-02)
explicitly checked this and noted: "Governance's apparent lack of a
top-level nav entry turning out to be intentionally gated behind
Settings → Account instead." Settings → Account is currently the
*only* discovery path for a regular member who isn't an artist.

## Why this is blocked, not done

Simply deleting Account's governance tab + link (as literally asked)
would leave non-artist members with **no way to find governance in the
app at all** — `/studio/governance` requires artist/board access they
don't have. That's a real access regression, not a cleanup.

Options, needs a decision:

1. Add a real top-level nav entry for `/governance` (sidebar +
   mobile), then remove both Account entry points — governance becomes
   independently discoverable for everyone, artist or not.
2. Keep exactly one Account entry point (drop the duplicate — the
   Membership tab's link-out button and the separate inline
   Governance tab are redundant with each other today) but leave it in
   Account, since Studio can't serve non-artist members.
3. Something else the user has in mind for where non-artist members
   should find this.

Not touched pending a decision.
