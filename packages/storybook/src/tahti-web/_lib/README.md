# tahti-web story helpers

Shared decorators, fixture overrides and `play` helpers for the stories in
`packages/storybook/src/tahti-web/`.

| File | What it gives you |
| --- | --- |
| `decorators.tsx` | `withTahtiRouter(path)`, `withMockAuth(user)`, `MOCK_USERS`, `withPageSurface()` |
| `mock-data.tsx` | `mockData(overrides)` for `parameters.mockData`, `withMockData(overrides)` decorator |
| `play.ts` | `withinBody`, `findDialog`, `openDialog`, `expectNoDialog`, `selectTab`, `findToast`, `expectVisible` |
| `location.ts` | `withLocationSearch(search)` story `beforeEach` for views that read `?token=` from `window.location` |

## Per-story mock data

Storybook builds tahti-web with `VITE_FORCE_MOCK=1`, so every API call
returns a fixture from `packages/tahti-web/src/api/mock.ts` (and the studio
mocks). A story can patch or replace individual fixtures without editing
the shared ones:

```tsx
import { mockData } from './_lib/mock-data';

export const MemberProfile: Story = {
  parameters: {
    mockData: mockData({
      // Deep-partial patch: objects merge key by key, arrays replace.
      profile: { artist: { displayName: 'Aurora Unit', bio: 'Live modular sets.' } },
      // Function form: gets the base fixture plus the call arguments.
      soundItems: (base, slug) => (slug === 'northern-lights' ? [] : base),
    }),
  },
};
```

- Overridable fixtures are listed in `MockFixtures` in
  `packages/tahti-web/src/api/mock-overrides.ts` (channel, profile,
  collection, smartLink, trackDetail, trackComments, soundItems, directory,
  search, radio, feed, announcements, fanTiers, venueProfile, chatHistory,
  topTracks, latestTracks, studioSounds, studioCollections, studioReleases,
  userLikes, channelEvents, publicGallery, tagTracks, channelVisual,
  channelVisualPresets, membership, resetPasswordInfo, setupPasswordInfo,
  chatAccess, chatToken, liveTracklist, channelSchedule, radioShow,
  radioShowNowPlaying, radioShowUpcoming, radioSlots, showBookings,
  conversations, conversation, messageContacts, myEvents, showSeries).
- A function override can throw to make the call fail the way the API
  would, e.g. `chatToken: () => { throw new Error('banned'); }`.
- APIs with no offline mock at all (Jam) are stood in for by a story-level
  fake: see `_fixtures/jam.ts`, which stubs `fetch` and `EventSource` in
  `beforeEach` and restores them afterwards.
- Derived fixtures follow their source: overriding `channel` also changes
  the profile, fan tiers and sound items built from it.
- Meta-level and story-level `mockData` deep-merge like any other
  parameter, so a meta can set a baseline and stories tweak it.
- `.storybook/preview.ts` sets the registry in a global `beforeEach` and
  clears it after each story. On a Docs page all stories share one
  registry, so overrides there are only reliable in the single-story view
  and in the test run.
- `withMockData(overrides)` does the same from a decorator, for stories
  that already compose decorators.

To make another fixture overridable: add a row to `MockFixtures` and wrap
the fixture's return value in `mockFixture('<key>', base, ...args)`.

Put rich, area-specific fixtures in a fixture file next to your stories
(e.g. `_fixtures/studio.ts`) rather than growing the shared `mock.ts`.

Overrides only cover reads. Mock *writes* (saving a channel look or a
preset) still change module state and localStorage; plays that save
should undo that in a story `beforeEach`, as
`_fixtures/channel-design.ts`'s `restoreChannelDesignState` does.

## Play functions

```tsx
import { expect, userEvent, within } from 'storybook/test';
import { findDialog, openDialog, selectTab } from './_lib/play';

export const ConfirmDelete: Story = {
  play: async ({ canvasElement }) => {
    const preview = await openDialog(canvasElement, /preview/i, 'Avatar');
    await userEvent.click(preview.getByRole('button', { name: 'Delete' }));
    const confirm = await findDialog(canvasElement, 'Remove avatar?');
    await expect(confirm.getByRole('button', { name: 'Remove' })).toBeVisible();
  },
};
```

- Dialogs, popovers, menus and toasts portal to `document.body`; query them
  with `withinBody(canvasElement)` (or the helpers above), not
  `within(canvasElement)`.
- Prefer roles and accessible names over test ids or CSS selectors.
- Use `find*` / `waitFor` for anything that appears after a fetch or an
  animation; never sleep.

## Running plays as tests

```sh
pnpm --filter @tahti-player/storybook test                 # every story
pnpm --filter @tahti-player/storybook test src/tahti-web/TrackDetailView.stories.tsx
```

Each story renders in headless Chromium through `@storybook/addon-vitest`;
a story without `play` still fails if it throws while rendering. CI runs
the same command in the `Storybook (plays)` job. First run locally needs
`pnpm --filter @tahti-player/storybook exec playwright install chromium`.
