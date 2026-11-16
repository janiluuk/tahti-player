# Listener stats: full origin / referrer URL

**Status:** open

## Goal

Studio listener stats (and the matching track insights / audience panels)
should show the **full origin URL** listeners were referred from, not only
the referrer host.

## Context

Listen sessions already record a coarse referrer **host** (see HISTORY
2026-10-27 — heartbeat sends the entry referrer host; Studio → Stats →
Plays / Audience “source”). Artists still cannot see the concrete page or
campaign URL that sent the listen (path, query, full URL).

## Likely work

1. **tahti-org** — persist and expose a referrer/origin URL field on listen
   sessions (privacy: strip fragments / credentials; decide host-only vs
   full URL retention). Aggregate or list in the stats / insights APIs.
2. **tahti-player** — show origin URLs in Studio Stats (Plays / Audience /
   referrers) and per-track insights, with a sensible fold for long URLs
   and “Other” for rare ones.
3. Mock + Storybook coverage for the new column/list.

## Done when

Artists can see where listens came from as URLs (or path+host), not only
the referring domain.
