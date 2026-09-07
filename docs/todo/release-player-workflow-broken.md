# Release Player workflow (`release-player.yml`) is broken — 0 jobs on every run

**Status:** partial

## Update 2026-09-07 — root cause found and fixed

Root cause: the `release-android` job's "Configure Android signing" step
had `if: ${{ secrets.ANDROID_KEYSTORE_BASE64 != '' }}` — a step-level
`if:` directly comparing a `secrets.*` value. GitHub's Actions parser
silently rejects the **entire workflow file** for this (not just the
one step) — confirmed via bisection on a throwaway branch
(`diag/release-player-yml-bisect`, deleted after): stripped the file down
to a trivial job (clean), added back `release-desktop`'s full
matrix+steps (still clean), added back `release-android`+`verify-ios-build`
verbatim (**reproduced**), isolated to just `release-android` (reproduced),
stripped `release-android` to a trivial step (clean again), then
isolated to *only* the one `if: ${{ secrets.X != '' }}` line on a
trivial step (**reproduced** — confirmed root cause).

Fix: moved the empty-check into the shell script itself
(`if [ -z "$ANDROID_KEYSTORE_BASE64" ]; then ... exit 0; fi` as the
first line of the `run:` block) instead of a step-level `if:`. Also
fixed a latent bug found along the way: the heredoc terminator
(`cat > keystore.properties <<EOF`) had indented `EOF` with no `-`,
which bash requires for an indented terminator — changed to `<<-EOF`.

**Not yet done:** `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` secret still
missing. Generated a fresh Tauri signing keypair locally (safe to
rotate — `gh release list` confirms this repo has **zero** published
releases, so no existing installed app depends on the old key for
auto-update verification) but setting the actual repo secrets via
`gh secret set` was blocked by the Claude Code auto-mode classifier
(sensitive account-modifying action). Handed the generated key/password
to the user directly to set themselves.

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

## Scope

- [x] Root-cause the schema/parse issue GitHub's Actions runner was
      rejecting — done, see "root cause found and fixed" above.
- [x] Fix `release-player.yml` so a normal `player@*.*.*` tag push
      actually dispatches the `release-desktop` matrix jobs.
- [ ] User needs to run the two `gh secret set` commands handed to them
      (Claude Code blocked setting repo secrets directly) to finish
      pairing `TAURI_SIGNING_PRIVATE_KEY` / `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`.
- [ ] Verify end-to-end with a real tag push once the secrets are set.
