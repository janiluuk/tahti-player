# Radio playlist manager access and UX

**Status:** blocked

Manager UX shipped in tahti-web 0.0.481 and 0.0.485 (see HISTORY). The admin rotation list matches the on-air row by `soundId` from `/api/v1/radio/recently-played` and falls back to the title.

## Left (tahti-org)

- [ ] The public Radio widget "Next:" line comes from `nowPlayingNext`, which `channels/get.ts` still finds by title. Store the now-playing sound id on the station so the API (and the admin page, without the recently-played lookup) can match by id.
