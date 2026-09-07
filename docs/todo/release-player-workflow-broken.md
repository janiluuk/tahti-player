# Release Player workflow (`release-player.yml`) is broken — 0 jobs on every run

**Status:** open

## Symptom

`.github/workflows/release-player.yml` (desktop Tauri build/release, triggered
on `player@*.*.*` tag pushes from `bump-and-tag-player.yml`) has failed on
**every single run** for at least the last ~10 pushes to `master`
(checked back to commit `a39b77be1`, 2026-09-07), well before today's
changes — not a regression from any recent work.

Each failed run:
- Dispatches **zero jobs** (`gh api .../jobs` → `{"total_count":0,"jobs":[]}`,
  same for the check-suite's check-runs).
- `gh run view <id>` reports: *"This run likely failed because of a
  workflow file issue."*
- The run's `name` field comes back as the literal path
  `.github/workflows/release-player.yml` instead of the file's own
  `name: Release Player` — a strong signal GitHub's parser is rejecting
  the file wholesale (not a normal job failure), even though the file
  parses fine locally (`python3 -c "import yaml; yaml.safe_load(...)"` is
  clean, no tabs, no CRLF, no non-ASCII bytes).

`bump-and-tag-player.yml` itself is fine (succeeds every time, creates the
`player@X.Y.Z` tag correctly) — the break is specifically in
`release-player.yml`'s own GH-Actions-schema validity, not the tagging step.

## Related, separate finding: signing key secret mismatch

`gh secret list` shows `TAURI_SIGNING_PRIVATE_KEY` exists but
**`TAURI_SIGNING_PRIVATE_KEY_PASSWORD` does not** — the workflow references
both (`Build Tauri app` step). Even once the workflow-file issue above is
fixed, the build will very likely fail at the signing step with an empty
password against a password-protected key. Per user instruction: **generate
a fresh Tauri signing keypair if the existing one's password is unknown**
(`pnpm tauri signer generate -w <path>`, or the equivalent `@tauri-apps/cli`
invocation used elsewhere in this repo), then set both
`TAURI_SIGNING_PRIVATE_KEY` and `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` as repo
secrets together so they're always a matched pair.

## Next diagnostic step

Local YAML parsing (PyYAML) doesn't catch it, so the problem is in
GitHub's stricter Actions-schema validation, not raw YAML syntax. Fastest
path: open the file in the GitHub web editor (Settings → Actions →
workflow file, or the Actions tab's "..." → view/edit) which surfaces
inline schema errors GitHub's own parser catches, or run `actionlint`
locally against it. Only then attempt an actual content fix — guessing at
the schema issue blind risks masking the real one.

## Scope

- [ ] Root-cause the schema/parse issue GitHub's Actions runner is
      rejecting (see diagnostic step above).
- [ ] Fix `release-player.yml` so a normal `player@*.*.*` tag push actually
      dispatches the `release-desktop` matrix jobs.
- [ ] Regenerate the Tauri signing keypair (`TAURI_SIGNING_PRIVATE_KEY` +
      `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`) if the current key's password
      is unrecoverable, and set both secrets together.
- [ ] Verify end-to-end with a real tag push once both are fixed.
