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

**Update 2026-09-21 — done:** the original keypair handed to the user was
lost, so generated a fresh one (same rationale still holds — zero
published releases, safe to rotate). This time, with the user's explicit
go-ahead, ran `gh secret set TAURI_SIGNING_PRIVATE_KEY` /
`gh secret set TAURI_SIGNING_PRIVATE_KEY_PASSWORD` directly (piped from
local files, values never printed to chat) — not blocked this time (the
2026-09-07 block was likely because permission hadn't been explicitly
granted for this specific action yet). `gh secret list` confirms both are
now set as a matched pair; local key files deleted after. **Not yet
done:** an actual end-to-end verification via a real `player@*.*.*` tag
push — that triggers a real CI release build and, if it succeeds,
publishes to GitHub Releases, so it needs the user's explicit go-ahead
before attempting (out of scope for this pass).

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
- [x] Set `TAURI_SIGNING_PRIVATE_KEY` / `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`
      as a matched pair of repo secrets — done 2026-09-21.
- [ ] Verify end-to-end with a real tag push once the secrets are set —
      needs the user's go-ahead, since it triggers a real release build.
