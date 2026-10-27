# Study: importing from mikseri.net

Originally requested as a research pass; updated after the official embed
contract was captured and implemented. Answers "what would it take to let a
user import their own tracks from mikseri.net, as files and as an embeddable
player," per the shapes this repo already supports
(`src/api/sources.ts`'s `SourceDef`, `src/lib/embedSrc.ts`'s `EmbedProvider`).

## What mikseri.net is

A long-running Finnish music-sharing community (musiikki.fandom.com /
Wikipedia: run by ~15 volunteers) where artists upload tracks, get rated, and
build a following — not a commercial DSP with a developer program. There is
no comparable API tier the way Bandcamp/SoundCloud/Google Drive/Mixcloud have
(all four of which back this repo's real `oauth`-kind sources today).

## Findings

**No public API, no OAuth, no developer docs.** Nothing under mikseri.net
exposes a documented REST/OAuth surface — no `/api/`, no app-registration
flow, no rate-limit or scope documentation anywhere on the site. This rules
out the same integration shape used for Bandcamp/SoundCloud/Google
Drive/Mixcloud (`SourceDef` with `kind: 'oauth'`, `oauthStartPath`,
`capabilities.connect/import`) — there is no credential exchange to build
against.

**The site's `robots.txt` explicitly reserves rights against automated
access**, citing the EU DSM Directive 2019/790 (the text-and-data-mining
opt-out article): it disallows every major AI/scraping bot by name
(ClaudeBot, GPTBot, Amazonbot, AhrefsBot, DataForSeoBot, …), sets
`ai-train=no`, and blocks crawling of `/mp3hifi/`, `/player/`, and several
action scripts (`/addevent.php`, `/playlist.php`) for all user agents. This
is a direct, on-the-record signal that the operator does not want automated
tools pulling data or media from the site — building a scraper (even one
scoped to "only the requesting user's own uploads") would run against that
stated position, and there is no OAuth handshake to prove "this is actually
your own track" the way there is for the four real oauth sources. **A
files-import source is not a good-faith option here without mikseri.net's
own cooperation** (a real API or an explicit written arrangement) — this
differs from the "no endpoint yet" gaps this repo already has for other
providers (e.g. Bandcamp catalogue import, which has a real, current OAuth
grant behind it); this is closer to "actively opted out."

**An embeddable per-track player does exist**, and is artist-initiated: the
site's own About page (`about.php`) describes it as *"tehdä kappaleistasi
soittimen, jonka voit upottaa muualle nettiin"* — "make a player from your
tracks that you can embed elsewhere on the web." That matches this repo's
existing `EmbedProvider` shape exactly (`src/lib/embedSrc.ts`:
`hearthisEmbedSrc`/`mixcloudEmbedSrc`/`spotifyEmbedSrc`/`bandcampEmbedSrc`,
each building an `<iframe>` src from a track/track-id the artist supplies —
no scraping, no auth, respects however the provider intends third-party
embedding). This is the one integration shape that's actually available
here, the same way hearthis.at/Mixcloud/Spotify/Bandcamp are embed-only in
this repo today (`EMBED_PROVIDER_LABEL`/`EMBED_PROVIDER_HEIGHT`).

The official embed builder emits
`https://www.mikseri.net/embed/?type=<type>&parameter=<parameter>` in a
450×190 iframe. The implemented allowlist covers individual tracks (`type=1`),
personal playlists (`type=2`), Top 40 (`type=5`), genre/tag lists (`8`, `9`,
`14`), weekly songs (`11`), promoted songs (`12`), and Listataivas (`15`).
Top 40 major genres use `parameter=0-<genre>-1`. Studio collection import is
deliberately narrower: only a numeric track ID, Mikseri track page, or official
`type=1` embed is accepted. Track pages are `/artists/<artist>/<song>/<id>/`;
artist pages also carry a numeric ID (`/artists/<name>.<id>.php`,
`/artists/?id=<id>`), so only the song-page shape is mapped to a track embed.
These formats come from search-engine results, not from crawling Mikseri.

## Recommendation

- **Shipped**: `MIKSERI` embed playback, artist-owned track references in
  Studio, personal playlist/track widgets, official chart presets, a Top 40
  major-genre selector, and an explicit-load left-sidebar widget.
- **Do not build**: a `SourceDef`/import source for mikseri.net files. There
  is no API to build one against, and the site's `robots.txt` is an explicit,
  documented objection to automated access — going around that with scraping
  would be different in kind from every other source this repo integrates
  with, all of which are either a real OAuth grant or a documented public
  API/embed contract.
- If file import is wanted later, the actual next step remains contacting
  mikseri.net directly about API or bulk-export access for artists moving
  their own catalog — not scraping.
