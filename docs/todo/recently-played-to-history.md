# Recently played moves from Listen to History

**Status:** open

Requested 2026-11-24: move the "Recently played" items from the Listen page under the History tab (`/?tab=history` / Library → History). Waits for the front-page loading PR (`feat/listen-calm-loading`), which changes the same Listen sections.

## Plan

- [ ] Remove the Recently played block from Listen (and from the Order sections list and saved layouts, without breaking stored layouts that name it).
- [ ] Show the same items at the top of History.
- [ ] Update tests, Storybook plays and e2e that expect it on Listen.
