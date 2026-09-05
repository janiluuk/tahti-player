# AGENTS.md

Guidelines for AI coding agents working on Tahti Player.

## Project Overview

Tahti Player is a free, open-source music player without ads or tracking, built on [Nuclear](https://github.com/nukeop/nuclear)'s player UI. Search for any song or artist, build playlists, and start listening. It's a desktop app built with Tauri (Rust + React), organized as a pnpm monorepo managed with Turborepo.

This repository is the Tahti fork of Nuclear (`janiluuk/tahti-player`), not a from-scratch rewrite. Upstream is `nukeop/nuclear`. How the fork, sibling API (`../tahti`), marketplace catalog (`../tahti-registry`), and `tahti-web` cutover fit together is in [`TAHTI.md`](./TAHTI.md).

**Themes** customize CSS variables that drive Tailwind classes. Users load JSON themes or use built-in ones. **Plugins** can control any part of the player; they are not sandboxed. The Store catalog is `tahti-registry`, not the on-disk runtime `plugins.json`.

### Packages

- `@tahti-player/player` - Main Tauri app (React + Rust)
- `@tahti-player/ui` - Shared UI components
- `@tahti-player/plugin-sdk` - Plugin system (published to npm)
- `@tahti-player/model` - Data model
- `@tahti-player/themes` - Theming system
- `@tahti-player/hifi` - Advanced HTML5 audio component
- `@tahti-player/tailwind-config` - Shared Tailwind config
- `@tahti-player/eslint-config` - Shared linting rules
- `@tahti-player/i18n` - Internationalization
- `@tahti-player/storybook` - Component demos
- `@tahti-player/tools` - Build and maintenance utilities
- `@tahti-player/docs` - Gitbook documentation
- `@tahti-player/website` - Project website (Astro)
- `@tahti-player/tahti-web` - Listen + studio SPA (beta.tahti.live); see `packages/tahti-web/AGENTS.md`

## Commands

```bash
# Development
pnpm dev                    # Run player in dev mode
pnpm dev:remote             # Same, but binds Vite to 0.0.0.0 so the remote control UI is reachable from other devices
pnpm storybook              # Run Storybook
pnpm dev:tahti              # Run tahti-web (see TAHTI.md)

# Build
pnpm build                  # Build all packages
pnpm tauri                  # Tauri CLI for the player
pnpm tauri build            # Build Tauri app

# Quality
pnpm lint                   # Lint all packages
pnpm lint:fix               # Lint and auto-fix
pnpm type-check             # TypeScript checks
pnpm test                   # Run all tests
pnpm test:coverage          # Run tests with coverage
pnpm clean                  # Clean build artifacts

# Package-specific tests: pass Vitest arguments directly, without an extra --
pnpm --filter @tahti-player/ui test src/components/Badge/Badge.test.tsx
pnpm --filter @tahti-player/ui test --testNamePattern="renders"

# Update only reviewed snapshots, then rerun the same tests without -u
pnpm --filter @tahti-player/ui test src/components/Badge/Badge.test.tsx -u
```

Check the runner's reported package path, selected test files, and test count.
An unexpected full-suite run is not evidence that the requested filter worked.
Root `pnpm test` uses Turbo; use package scripts for focused tests and snapshot
updates rather than copying argument forwarding between the two command layers.

## CI investigation and isolated checkouts

Use `--repo janiluuk/tahti-player` on repository-scoped `gh` commands. The CLI
can otherwise select the upstream Nuclear repository. Start from the linked
run's branch and SHA, not the current checkout's branch:

```bash
gh run view RUN_ID --repo janiluuk/tahti-player --json headBranch,headSha,jobs
gh run view RUN_ID --repo janiluuk/tahti-player --job JOB_ID --log-failed
```

If failed-log output is empty, download the job log directly:

```bash
gh api repos/janiluuk/tahti-player/actions/jobs/JOB_ID/logs > /tmp/tahti-ci-job.log
```

1. Inspect `git status --short`, `git worktree list`, and the run SHA. Fetch
   `origin` and compare the current remote target with that SHA; a newer branch
   may already contain the fix.
2. If the current checkout is dirty or on another branch, use an isolated
   worktree for the target. Preserve existing edits; do not stash, reset, or
   transfer unrelated changes. Reuse an existing worktree only after checking
   its branch and status.
3. Install dependencies in that worktree with `pnpm install --frozen-lockfile`.
   Do not symlink another checkout's root or package `node_modules`: workspace
   links and command resolution can point at the wrong source tree. Confirm
   the package path printed by each validation command belongs to this worktree.
4. Match the failed workflow: `.github/workflows/ci.yml` runs lint, tests, then
   build; `.github/workflows/coverage.yml` runs `pnpm test:coverage`. Reproduce
   the failed package first. For snapshot failures, compare the diff with the
   actual component before updating only the affected snapshots, then rerun
   without update mode and check affected consumer tests.
5. Keep fixing, committing, pushing, rebasing, and deploying distinct. Follow
   authorization already given in this conversation; a request to fix alone
   does not override the no-commit rule. Report the worktree, branch, validation,
   and whether the fix was committed/pushed. For an authorized rebase push,
   use a lease against the remote SHA observed before the rebase.

Resolve sibling repositories using the canonical map in
[`TAHTI.md`](./TAHTI.md#repository-and-checkout-map). A worktree under `/tmp`
does not acquire backend or registry siblings automatically.

## Code Style

### General Principles

- Prioritize readability over cleverness. This is production code for long-term maintenance — no placeholders, shortcuts, or half-baked methods.
- No comments in code - explain reasoning in chat/commits
- Avoid premature abstractions - start concrete, extract later
- Stick to existing conventions. Look at other packages when in doubt. Use the centralized TypeScript, ESLint, Prettier, and Tailwind configs.
- Small, focused changes over large dumps
- Trim dead code and copy-paste when you see it
- Never commit unless explicitly asked

## Import plugin configuration

Import-provider features belong in this sibling Nuclear repository rather than
the Tahti core repository. Every import plugin must expose configuration from
its Configure action in a modal: enter provider keys/settings, test the
connection, then save and enable only after the test succeeds. Do not create a
parallel configuration surface in Tahti core or silently enable an unverified
provider.

Open design questions to settle before extending the plugin API: whether
Configure is a first-class SDK lifecycle hook or a host-rendered settings
modal; the connection-test request/response and error contract; and whether
Save + Enable is atomic or separate. Keep the decision documented here and in
Tahti’s `AGENTS.md`.

## Tahti governance handoff

The governance API and official-record foundation live in the sibling
`../tahti` repository. Before adding governance UI here, inspect the sibling
API routes, shared DTOs, OpenAPI output, and `docs/governance-worklog.md`.

Governance navigation is intentionally split by context: member listeners use
`/governance` from Settings → Account, artists use `/studio/governance` from
Studio navigation, and board users use `/admin/governance` plus `/admin/agm`
from Admin navigation. Keep these functional surfaces; remove duplicate
global-rail or atlas-only governance links when consolidating navigation. The
route tree in `packages/tahti-web/src/router.tsx`, persistent chrome in
`AppShell.tsx`/`StudioNav.tsx`/`AdminNav.tsx`, and the corresponding
`mapScreens.ts`/`flowDiagrams.ts` records must agree before shipping.
Implement the player-side journeys against real contracts only: member motion
submission, discussion, advisory voting, feature requests, public closed-motion
history, yearly transparency reports, meetings, and published documents.

Keep advisory consultation visibly separate from binding association votes. Do
not claim that the player performs an official AGM ballot until the sibling API
has bylaws-backed eligibility, quorum, ballot, minutes, and result-certificate
contracts.

Use the player’s existing `PageHeader`, `StudioPanel`, `Badge`, `Button`, `Tabs`,
`Dialog`, and loading/empty/error components. Add user-visible strings through
i18n, add an integration journey test, and record the work in the player
worklog/changelog. Do not invent response shapes or silently mock governance
endpoints.

## Plugin and theme registry (`tahti-registry`)

The official marketplace catalog — what users see in the player Store — is
[github.com/janiluuk/tahti-registry](https://github.com/janiluuk/tahti-registry)
(`plugins.json`, `themes/`, generated `themes.json`). The player fetches it from
`https://raw.githubusercontent.com/janiluuk/tahti-registry/master` via
`packages/player/src/apis/pluginMarketplaceApi.ts` and
`packages/player/src/apis/themeRegistryApi.ts`. It replaces the upstream
`NuclearPlayer/plugin-registry` and `NuclearPlayer/theme-registry` repos.

Do not confuse it with the player's **runtime** install list (`plugins.json` on
disk). That file is what is already installed locally. The catalog is
`tahti-registry`. Auto-update compares the catalog `version`/`downloadUrl` to
the installed copy — a code-only bump that never lands in the catalog will not
reach users.

Prefer a sibling checkout at `../tahti-registry` (same parent as this repo and
`../tahti`). Otherwise clone or open a PR against that GitHub repo.

### After every plugin or theme change (required)

Before treating plugin work as done, open `../tahti-registry` (or fetch
`plugins.json` from GitHub) and check the listing:

1. **Added a plugin or theme** — it must have a new row in `plugins.json` (or
   `themes/`). Users must be able to see it in that repo. Do not ship a store
   plugin only in this monorepo.
2. **Changed an existing plugin or theme** (behavior, metadata, repo, category,
   download URL, listing id) — bump the plugin's own `package.json` `version`
   **and** the matching `version` (and `downloadUrl` / release tag) in
   `tahti-registry`. Cut a GitHub release with `plugin.zip` when the store
   install path is used.
3. **Renamed, recategorized, retargeted, or removed** — update or delete the
   catalog row in the same change set.
4. Run that repo's `pnpm validate` / `pnpm check-plugins` (and the theme
   validators). Do not leave the catalog stale.

In-app Tahti page add-ons (Settings → Add-ons widgets that are not marketplace
zips) stay owned here, but if they also have a public store listing, that
listing still lives in `tahti-registry`.

### Runtime registry separation guardrail

Start separating the plugin registry conceptually, but do not break or migrate
the current runtime registry yet. First inventory all callers, the persisted
`plugins.json` format, bootstrap ordering, and enable/update/removal semantics.
Then define a compatibility interface and contract tests around the existing
implementation. Keep the current registry as the runtime source of truth until
the adapter, rollback plan, and ownership split between player core, plugin SDK,
and import-provider plugins are accepted. Do not change registry keys, storage
location, discovery semantics, or bootstrap order during preparation.

### TypeScript

- Use `type` not `interface` (except when merging is required). Do not use interfaces for props.
- No magic numbers - extract into named constants
- Strict mode with `noUnusedLocals` and `noUnusedParameters`
- Do not use one-letter variable names.
AVOID: `(b) => b.buildIndexEntry()`
PREFER: `(build) => build.buildIndexEntry()`

### React Components

```tsx
import { cva, VariantProps } from 'class-variance-authority';
import { ComponentProps, FC } from 'react';

import { cn } from '../../utils';

const componentVariants = cva('base-classes', {
  variants: { /* ... */ },
  defaultVariants: { /* ... */ },
});

type ComponentProps = ComponentProps<'div'> &
  VariantProps<typeof componentVariants>;

export const Component: FC<ComponentProps> = ({
  className,
  variant,
  ...props
}) => (
  <div className={cn(componentVariants({ variant, className }))} {...props} />
);
```

- Use `const Component: FC<Props>` not `function Component()`
- Compound components (`Component.Sub`) for complex widgets
- Keep business logic out of UI components. Presentation-only; lift complex or performance-critical work to Tauri (Rust).

### Storybook-first UI

When changing anything a user sees (layout, controls, status, empty/loading, overlays), **prefer a component that already exists in Storybook** (`pnpm storybook`, `packages/storybook/src/`). That catalogue is `@tahti-player/ui` plus tahti-web local shared pieces under `packages/storybook/src/tahti-web/`.

1. Look up the Storybook story first. Use that component. Do not hand-roll a second button, badge, tab strip, dialog, empty state, or image treatment.
2. If the Storybook component shows different **data** or **behavior** than the live screen, keep the live data and features. Swap only the visual primitive. Do not drop overlays, counts, routes, or actions to make the page look more like the demo.
3. If no Storybook component exists at all, add it there with the states that exist today (default, empty, loading, error, disabled, selected — whichever apply). Flag states the component should have but does not yet (`Missing states:` in the story docs). Then use it.
4. If a Storybook story is an **orphan** (nothing in the player or tahti-web renders that component), flag it on the story (`Orphan:` in the docs description, and why). Do not delete it in the same pass as a UI sweep unless the user asked to remove it.
5. New `@tahti-player/ui` components still follow the directory/test/export checklist below.

### Adding UI Components

When adding a new component to `@tahti-player/ui`:

1. Create component directory: `packages/ui/src/components/MyComponent/`
   - `MyComponent.tsx` - implementation
   - `MyComponent.test.tsx` - tests (aim for 100% coverage)
   - `index.ts` - re-exports
2. Export from `packages/ui/src/components/index.ts`
3. Add Storybook story in `packages/storybook/src/MyComponent.stories.tsx`
4. Include snapshot test(s) covering all variants

### Styling (Tailwind v4)

- CSS-first config in `packages/tailwind-config/global.css` (`@theme` / `@layer`). There is no `tailwind.config.js`.
- Do not use Tailwind's built-in color palette. Prefer the tokens in `global.css`.
- Theme colors: `bg-background`, `text-foreground`, `bg-primary`
- Accents: `accent-green`, `accent-yellow`, `accent-purple`, `accent-blue`, `accent-orange`, `accent-cyan`, `accent-red`
- Fonts are design-system defaults (`font-sans`, `font-heading`). You rarely need to set fonts by hand.
- Use `cn()` for conditional classes, `cva()` for variants

### State Management

- **Zustand** - persistent UI state
- **React state** - local, temporary state
- **TanStack Query v5** - HTTP requests/server state
- **TanStack Router** - client-side routing

### Standardized Libraries

- **Icons**: Lucide React (not heroicons, not font-awesome)
- **Toasts**: Sonner
- **Dates**: Luxon
- **Utilities**: lodash-es (use individual imports: `import isEqual from 'lodash-es/isEqual'`)
- **HTTP**: Native fetch via ApiClient base class (no axios)

### Adding New Domains

A "domain" is a feature area exposed to plugins (e.g., settings, queue, favorites). When adding a new domain:

1. **Types** (`packages/plugin-sdk/src/types/myDomain.ts`)
   - Define the `MyDomainHost` interface (the contract between player and SDK)
   - Export any related types plugins will use

2. **API class** (`packages/plugin-sdk/src/api/myDomain.ts`)
   - Create a class that wraps the host and exposes methods to plugins
   - Add to `TahtiAPI` constructor in `packages/plugin-sdk/src/api/index.ts`

3. **Store** (`packages/player/src/stores/myDomainStore.ts`)
   - Zustand store holding the domain state
   - Persists to disk via `@tauri-apps/plugin-store` if needed

4. **Host** (`packages/player/src/services/myDomainHost.ts`)
   - Implements the `MyDomainHost` interface
   - Bridges the SDK API to the Zustand store
   - Passed to `TahtiAPI` when initializing plugins

### External API Clients

Live in `packages/player/src/apis/`. Use `ApiClient` base class (fetch→json→Zod).

- Validate external data with Zod schemas
- Export singleton instances
- One class per external service

### Internationalization

All user-facing strings go through i18n - no hardcoded UI text.

```tsx
import { useTranslation } from '@tahti-player/i18n';

const { t } = useTranslation();
<span>{t('navigation.settings')}</span>
```

Add new strings to `packages/i18n/src/locales/en_US.json` only. Other locales come from Crowdin.

## Persistent chrome visibility

On every ordinary app surface (Listen, Radio, Discover, Studio, Admin,
Settings, Help, member governance, and their child routes), the
navigation that belongs there must stay visible at every moment: desktop
sidebar, mobile drawer trigger and bottom bar, Studio/Admin section
tabs, and in-page subtabs. Do not unmount, hide, or swap that chrome
away during route transitions, loading, or content swaps. A flash of
empty chrome is a bug, not an acceptable transition.

This does **not** apply to surfaces that are supposed to take over the
window: the full-screen player, public release/share canvases, and
maximized workspaces such as the audio editor (Pro Editor). Missing
sidebar or tab chrome there is correct. Do not force the sidebar back
onto those pages or treat them as failed highlights.

## Testing

On views that should show app chrome, assert that the sidebar, drawer,
bottom bar, or subtabs are present — not only after a long wait. If they
disappear mid-navigation on a chrome view, fix the unmount; do not
paper over it in the test. Query the nav before asserting
`aria-current` / `aria-selected`.

This does **not** apply to the full-screen player, public release/share
canvases, or maximized editor workspaces named above.

For any menu, route, or navigation active-state change, permanently include a
Playwright check of all governance contexts: Settings → Account must reach
member governance, Studio Governance must keep Motions/Topics highlighted for
their query-string routes, and Admin Governance/AGM must keep the Community
section and correct submenu item highlighted. Verify the actual navigation
entry points, not only direct route rendering. On chrome views, re-check that
the expected nav is still mounted before asserting `aria-current` /
`aria-selected`.

Tests use Vitest + React Testing Library. Globals enabled (`describe`, `it`, `expect`, `vi`). Coverage is V8-based across packages and reported in CI. Run tests with `pnpm test` (or a package filter), not a separate IDE test-runner tool.

- Integration tests over unit tests for user-facing behavior. Render real components and assert on DOM content rather than verifying mock calls.
- Unit tests for utilities - standalone data structures (RingBuffer, parsers) deserve isolated tests. Use them sparingly.
- Test user behavior, not implementation details
- Minimize mocks - only mock external deps (HTTP, FS, Tauri)
- Snapshot tests: prefix with `(Snapshot)`, basic rendering only
- Never use `querySelector` in tests. Prefer RTL queries.
- When semantic queries aren't possible, add `data-testid` attributes. And don't be shy with them
- Don't use defensive measures like try-catch or conditional checks in tests. The test will fail anyway if our assumptions are wrong.

### Test-first for views

When building a new view, write the test wrapper and tests **before** any implementation code. The tests describe what the user sees and does — they define the contract. Then implement to make them pass.

Don't start with unit tests for internal utilities (grouping functions, registries, etc.). Start from the outside: what does the user see on the page? The internal structure is an implementation detail that falls out of making the tests green.

### Test Wrappers for Views

Player views and some components use a `*.test-wrapper.tsx` file that creates a domain-specific abstraction layer over the DOM. This lets tests read like user stories, and if the implementation changes, only the wrapper needs updating.

**Wrapper conventions:**
- Use **getters** for element queries: `get emptyState()`, `get cards()` — not `getEmptyState()`
- Use **nested objects** for interactive elements: `createButton: { get element(), async click() }`
- Use **methods** for multi-step user actions: `async openContextMenu(title: string)`
- Tests should use `Wrapper.emptyState`, `Wrapper.cards`, `Wrapper.createButton.click()` — not bare `screen` queries
- The wrapper is the only place that knows about test IDs, roles, and DOM structure
- Don't use queryX methods in the wrapper - always get or find as appropriate.
- Never use fireEvent. Always use userEvent for interactions.

### Test fixtures

To populate the app with testing data, use fixtures. See `packages/player/src/test/fixtures` for examples.

### Wrapper fixtures

Test wrappers can expose a `fixtures` object with factory methods that return pre-configured builders for common test scenarios. This keeps test setup readable and co-located with the wrapper, while the raw fixture data itself lives in `packages/player/src/test/fixtures/`.

```tsx
// Dashboard.test-wrapper.tsx
import { TOP_TRACKS_RADIOHEAD } from '../../test/fixtures/dashboard';

export const DashboardWrapper = {
  // ... mount, getters, etc.

  fixtures: {
    topTracksProvider() {
      return new DashboardProviderBuilder()
        .withCapabilities('topTracks')
        .withFetchTopTracks(async () => TOP_TRACKS_RADIOHEAD);
    },
  },
};

// Dashboard.test.tsx
DashboardWrapper.seedProvider(DashboardWrapper.fixtures.topTracksProvider());
```

### The builder pattern for tests

We use builders to create test data and various entities cleanly. You can see them in `packages/player/src/test/builders`.

- A builder is a class that has an instance of the object it's building
- When the builder is instantiated, it creates a default object with reasonable defaults
- The builder has methods that mutate the object and return `this` for chaining
- The `build()` method returns the final object, which can then be used in tests

```tsx
// Playlists.test-wrapper.tsx
export const PlaylistsWrapper = {
  async mount(): Promise<RenderResult> { /* ... */ },

  get emptyState() {
    return screen.queryByTestId('empty-state');
  },
  get cards() {
    return screen.queryAllByTestId('card');
  },

  createButton: {
    get element() {
      return screen.getByTestId('create-playlist-button');
    },
    async click() {
      await userEvent.click(this.element);
    },
  },
};

// Playlists.test.tsx — reads like a user story
it('shows empty state when no playlists', async () => {
  await PlaylistsWrapper.mount();
  expect(PlaylistsWrapper.emptyState).toBeInTheDocument();
});
```

## File Organization

```
packages/ui/src/components/Badge/
  Badge.tsx           # Implementation
  Badge.test.tsx      # Tests
  index.ts            # Re-exports
  __snapshots__/      # Vitest snapshots
```

## Rust Backend

The Tauri backend lives in `packages/player/src-tauri/src/`. Modules:

- `bridge/` - bidirectional RPC. Lets Rust servers call into the frontend (`Bridge::call` emits a `bridge:request` event, frontend replies via the `bridge_respond` command).
- `http_api/` - Axum REST + SSE server for Tahti Jam remote control
- `mcp/` - MCP server exposing player functions as tools to LLM clients
- `mpd/` - MPD-protocol TCP server for clients like ncmpcpp
- `stream_server.rs` - local audio proxy adding CORS + Range so the browser can play blocked streams
- `http.rs` - `http_fetch` command, a CORS-bypassing HTTP proxy for the frontend
- `ytdlp.rs` / `ytdlp_setup.rs` - yt-dlp subprocess wrapper; auto-downloads the binary
- `discord.rs` - Discord Rich Presence
- `commands.rs` - filesystem helpers (zip, download, flatpak detection)
- `net.rs`, `setup.rs`, `logging.rs` - port binding, log plugin config, startup log ring buffer
- `lib.rs` - declares modules, registers all commands, runs `init_*` in `.setup()`. `main.rs` - binary entry, env fixups.

Commands (run from `packages/player/src-tauri/`):

```bash
cargo test          # Rust tests (no clippy/rustfmt configured; run manually)
```

`pnpm dev` runs `tauri dev`; `pnpm build` (in `packages/player`) runs the full `tauri build`.

## Design Philosophy

- Neo-brutalist with premium polish - bold borders, purposeful shadows
- Professional and approachable, not decorative
- Animations via `motion` and `tw-animate-css` should help UX, not slow it down
- Disable animations during high-friction moments (resize, drag)
- Avoid generic AI patterns (icon-grid cards, stock heroes, "Built with love" badges)

## Tooling Notes

- **pnpm** with workspace protocol for internal deps
- **Turborepo** for task orchestration
- **Vite** for frontend builds, **Vitest** for tests
- **ESLint + Prettier** run together
- **Husky + lint-staged** for pre-commit hooks

Use centralized configs from eslint-config and tailwind-config packages.

Assume TanStack Router routes regenerate on dev - don't regenerate manually.

## Changelog

`packages/player/changelog.json` is the source of truth for the in-app "What's New" tab and auto-generated GitHub release notes. The "What's New" tab groups entries by week and shows one row per week (same-week entries are merged into one row), so every entry should also be readable as one line within that combined row.

When building a user-facing feature, fix, or improvement, add an entry to the top of the array according to the format you find there. **Every entry's `description` must explain how the change makes things better for the person using it, in plain language — not what changed at the implementation level.** Write it for the reader of the "What's New" tab, not for a reviewer of the diff: say what they can now do, or what stopped being broken, not which component/file/API changed. "Bandcamp tracks now play in-app" is right; "Added BANDCAMP to the EmbedProvider union and wired embedSrcFor" is wrong — that belongs in the worklog entry and commit message, not the changelog.

## Releasing

### Tahti Player

Releases are triggered by git tags. The workflow builds for macOS (arm64/x64), Linux, and Windows. Release notes are auto-generated from `packages/player/changelog.json`.

```bash
# 1. Bump versions, update the appstream metainfo, commit, and tag
pnpm release:prepare X.Y.Z

# 2. Push the tag
git push origin player@X.Y.Z
```

`release:prepare` does everything that's needed for a release. Do not bump versions or edit any files by hand when preparing a release.

The `release-player.yml` workflow creates a GitHub release with platform binaries.

### Plugin SDK

Published to npm via the `release-plugin-sdk.yml` workflow.

```bash
# 1. Update version in packages/plugin-sdk/package.json
# 2. Commit the version bump
git add packages/plugin-sdk/package.json && git commit -m "plugin-sdk@X.Y.Z"

# 3. Tag and push
git tag plugin-sdk@X.Y.Z
git push origin plugin-sdk@X.Y.Z
```

The workflow builds with `build:npm`, runs tests, and publishes to npm.
