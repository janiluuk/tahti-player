# Fan live chat vs channel comments

**Status:** partial  
**Source:** Artist lifecycle e2e (`…/artist-lifecycle/ISSUES.md` P1)

## Done

- LIVE channel surfaces chat above comments (#916); Live chat block points at `/chat/$slug` (#914).
- Mock fan room token + local echo Send under `VITE_FORCE_MOCK` (#934); ChannelView live CTA test (#939).

## Left

- Real Centrifugo Send for brand-new channels against the live API (not mock).
