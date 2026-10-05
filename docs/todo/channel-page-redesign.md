# Artist channel page redesign

**Status:** partial

The artist channel page (`/channel/:slug`, `packages/tahti-web/src/views/ChannelView.tsx` plus `src/components/channel-view/`) still doesn't look professional. Example: https://beta.tahti.live/channel/tahti-selects

## Done (2026-10-05)

- **False "On air" badge**: the API sends `signalConnected`, true only with a real ingest signal; the 24/7 rotation sets `state` to LIVE without it. The page now shows "On air" only with a signal, "24/7 rotation" when the stream plays without one, and "Offline" otherwise (#520).
- **Borders, clipped icons, clipped tracklist**: one cause. On desktop the shell's inset sat outside the scroll area, so the page's negative margins pushed it under the clip edge. The channel and track pages now reach the pane edges (#518).
- **Phone hero**: Subscribe no longer covers the channel name (#519).
- A radio-station channel has no Subscribe button (#521).

## Left

- [ ] Check the four fixes on beta at desktop and phone widths once merged.
- [ ] The rest of the redesign: the page still reads as stacked blocks (hero, stage, tracks, comments). Decide what "professional" should look like beyond the fixes above, ideally with a reference.
- [ ] Light theme and Storybook story pass for the channel page.
