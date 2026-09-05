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

