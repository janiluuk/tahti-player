# CI performance audit (tahti-player and tahti-org)

**Status:** open

Requested 2026-11-24: look for speed gains in CI for both repos.

## Plan

- [ ] Pull recent run timings per job (`gh run list` / `gh run view --json jobs`) for both repos; find the critical path.
- [ ] Check caching: pnpm store, turbo remote/local cache, Playwright browsers, Storybook build, Docker layers (tahti-org).
- [ ] Check sharding and parallelism (Storybook plays, e2e, vitest), duplicated work between jobs, jobs that run on unchanged paths.
- [ ] Write findings with estimated savings; implement the safe ones.
