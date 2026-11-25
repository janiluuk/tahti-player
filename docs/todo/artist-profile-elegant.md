# Public artist page redesign

**Status:** partial

Phone header (`EntitySocialHeader` `compactOnPhone`, ~470 → ~225 px on Yaniho) and phone order shipped in 0.0.485 (see HISTORY). Desktop unchanged.

The oversized Yaniho backdrop was also an initial-load race: the public profile supplied its image before the channel visual request revealed `headerStyle: GRADIENT`. Version 0.0.486 tracks channel-visual completion and withholds the profile fallback until that request settles.

## Left

- [ ] Turn on `compactOnPhone` for the collection, venue, radio show and channel fallback headers, each with a 390 px visual check.
- [ ] Low-contrast text on the artist page dark scheme: the "On SoundCloud" heading and the Fan tiers price.
