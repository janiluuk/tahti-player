# TESTING

Extracted from root `AGENTS.md` for on-demand reading.

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

**"Visual diff" / "screenshot diff" = the CI snapshot digest**, not Storybook. When a PR comment or a report says something like "N mismatch(es) already failing on master" or "Snapshot digest", that's the Vitest DOM-snapshot mismatch system (`scripts/ci/build-snapshot-digest.mjs`, `vitest-snapshot-reporter.mjs`, `publish-visual-snapshot-diffs.mjs`, posted to the PR by `comment-snapshot-digest.mjs`; artifact `snapshot-digest`, see the `test-core` job in `.github/workflows/ci.yml`). It covers the packages that register `scripts/ci/vitest-ci-reporters.mjs` (ui, player, themes, model, plugin-sdk, hifi; not tahti-web). It fires from that job's `Test` step failing, and only lists genuinely new mismatches vs. the base branch — a standing "already failing on master" count is pre-existing breakage, not something this PR caused. When the digest reports `newCount: 0` (only standing mismatches) and no non-snapshot failures, `test-core` soft-passes so PRs are not blocked on master debt (`scripts/ci/should-fail-core-tests.mjs`). **Confirm path:** unit coverage in `scripts/ci/should-fail-core-tests.test.mjs` (`node --test scripts/ci/should-fail-core-tests.test.mjs`); a PR with only standing mismatches should exit 0 from `should-fail-core-tests.mjs` when `snapshot-digest/digest.json` shows `newCount: 0`. A separate Storybook _build_ failure (`storybook build` erroring during `pnpm turbo build`) is a different, unrelated CI step — don't conflate the two when triaging a red run.

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

Some components (e.g. `packages/ui/src/components/CardsRow/CardsRow.test-wrapper.tsx`) use a `*.test-wrapper.tsx` file that creates a domain-specific abstraction layer over the DOM. This lets tests read like user stories, and if the implementation changes, only the wrapper needs updating.

**Wrapper conventions:**

- Use **getters** for element queries: `get emptyState()`, `get cards()` — not `getEmptyState()`
- Use **nested objects** for interactive elements: `createButton: { get element(), async click() }`
- Use **methods** for multi-step user actions: `async openContextMenu(title: string)`
- Tests should use `Wrapper.emptyState`, `Wrapper.cards`, `Wrapper.createButton.click()` — not bare `screen` queries
- The wrapper is the only place that knows about test IDs, roles, and DOM structure
- Don't use queryX methods in the wrapper - always get or find as appropriate.
- Never use fireEvent. Always use userEvent for interactions.

### Test fixtures

To populate the app with testing data, use fixtures. See `packages/hifi/src/test/fixtures` and `packages/tahti-web/src/test/` for examples.

### Wrapper fixtures

Test wrappers can expose a `fixtures` object with factory methods that return pre-configured builders for common test scenarios. This keeps test setup readable and co-located with the wrapper, while the raw fixture data itself lives in the package's `src/test/fixtures/`.

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

We use builders to create test data and various entities cleanly. You can see them in `packages/hifi/src/test/builders`.

- A builder is a class that has an instance of the object it's building
- When the builder is instantiated, it creates a default object with reasonable defaults
- The builder has methods that mutate the object and return `this` for chaining
- The `build()` method returns the final object, which can then be used in tests

```tsx
// Playlists.test-wrapper.tsx
export const PlaylistsWrapper = {
  async mount(): Promise<RenderResult> {
    /* ... */
  },

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

### Fast local runs

| Command                     | What it runs                                                                                                                | Wall time (Mac, 2026-11-25)      |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| `pnpm test`                 | every package's Vitest, no Storybook plays; no dependency builds first                                                      | ~70 s cold, cached packages skip |
| `pnpm test:changed`         | only affected packages, and in each only tests related to files changed since `origin/master` (`TEST_BASE=<ref>` to change) | seconds                          |
| `pnpm test:stories`         | every story play, 50 story files per Chromium session, two sessions at a time                                               | ~4 min                           |
| `pnpm test:stories:changed` | plays for stories that changed or name a changed component / import a changed module                                        | ~25 s for ~50 stories            |
| `pnpm test:all`             | `pnpm test` plus `test:stories`                                                                                             |                                  |

`node packages/storybook/scripts/run-plays.mjs --changed origin/master --list`
prints the story selection without running it; `--chunk` and `--jobs` tune
the session size and parallelism.

tahti-web runs Vitest with `isolate: false`: test files share a worker and
`src/test/setup.ts` resets the DOM, storage, stubs, spies, URL,
`window.location`, getters shadowed on `document` (`hidden`,
`visibilityState`), animation frames and module registry after each file.
`vi.mock` does not carry over: Vitest 4 keeps one mock registry per test
file, and the setup's `vi.resetModules()` drops modules that an earlier file
evaluated against its mocks. What does carry over is anything outside the
module registry: globals and prototypes patched by hand (use
`vi.stubGlobal` / `vi.spyOn`, which the setup undoes, not
`Object.defineProperty` or plain assignment), and state inside externalized
`node_modules` packages, which `vi.resetModules()` does not reload (motion
keeps the `requestAnimationFrame` it saw first, so `src/test/animationFrames.ts`
installs a real-timer one before motion loads). To hunt a
leak, shuffle the file order:
`pnpm exec vitest run --exclude 'e2e/**' --sequence.shuffle.files --sequence.seed=<n>`,
then rerun the failing file with candidates and `--maxWorkers=1`.

### Storybook play tests (headless Chromium)

The Storybook Vitest project can drop its browser connection after many story
files in one session (~90s of reload churn). **Locally**, run at most **~60
story files per invocation** and bisect when a chunk fails:

```bash
cd packages/storybook
pnpm exec vitest --project storybook --no-file-parallelism \
  src/tahti-web/Studio*.stories.tsx
# Halve the glob until one file reproduces, or use tahti-ops (chunked):
pnpm tahti-ops test storybook -- src/tahti-web/Admin
```

CI shards (~50 files) plus one retry; Chromium launches with
`--disable-dev-shm-usage` (see `packages/storybook/vitest.config.ts`) so small
`/dev/shm` runners do not kill the renderer mid-run.

## CI pipeline (`.github/workflows/ci.yml`)

- **`changes`** decides what runs. A PR that only touches Markdown, `docs/`, `packages/docs/` or images skips everything below; the `CI` gate counts skipped jobs as passed. Finer outputs (`web`, `storybook`, `player`) skip UI/player work on PRs that do not touch those packages (master and manual runs still run everything).
- **`build-player`** ("Build + lint"): size guard, lint, and the API-routes check (tahti-web's API paths against the latest tahti-org OpenAPI export) on every code change; the player / plugin-sdk / hifi builds run only when `player` paths (or Rust) changed. Each step runs even when an earlier one failed, so one run reports them all.
- Lint and **`test-core`** run only the packages a PR affects and their dependents (`turbo --affected` against the PR base); pushes to master run every package.
- **`test-web`**: tahti-web's Vitest suite in four shards (`--shard=N/4`), only when `web` paths changed. Workspace packages export their sources, so no build is needed.
- **`storybook`**: story plays as ten Vitest shards (one Chromium page per shard; past ~100 story files the renderer crashes), run three or four at a time on three runners ("plays 1/3" … "plays 3/3"), only when `storybook` paths changed.
- **`e2e-mock`**: role / use-case journeys against the mock app on **master pushes and `workflow_dispatch` only** (not on PRs; not part of the required `CI` gate), in six Playwright shards ("mock app 1/6" … "6/6"). The beta and Storybook deploys wait for the whole CI workflow, journeys included; on master pushes `web-dist` builds the production bundle in parallel and the self-hosted beta deploy ships that artifact instead of rebuilding. Playwright Chromium is cached like the Storybook job.
- **Coverage** (`coverage.yml`) runs on master pushes and by hand only.
- Shared setup (Node 24, pnpm store cache, frozen install, optional turbo cache) is the composite action `.github/actions/setup`.
