# Red CI: tahti-player master + tahti-org Stack smoke

**Status:** open

## 1. tahti-player master CI - "API routes exist" fails

- Run: CI on master, run `44960418110` (also `44952236571`), job **Build + lint**, step **API routes exist** (`packages/tahti-web/scripts/check-api-routes.mjs`).
- Output:
  ```
  The app calls API paths the server does not serve:
    /api/me/password/set  (api/account-credentials.ts:65)
  ```
- Cause: #2112 (set a first password for Google/Facebook accounts) calls `/api/me/password/set`. The route shipped in tahti-org#1125 (merged 2026-11-21 21:22), but the check reads the **latest tahti-org GitHub release** OpenAPI, and the latest release is still `2026-11-21-1` (15:51, before #1125).
- Fix, either:
  - [ ] Cut the next tahti-org release (includes #1125), then re-run master CI; or
  - [x] (feat/next-50-slices-2, 2026-11-22) Add `"/api/me/password/set": "Shipped in tahti-org#1125; remove once the next tahti-org release is out."` to `packages/tahti-web/scripts/api-routes-allowlist.json` on a branch off `origin/master`, PR, merge. Remove the entry after the release.

## 2. tahti-org Stack smoke - fails at pnpm setup (every weekly run since 2026-10-25)

- Run: `45021891722` (tahti-org, schedule), job **Build stack and probe**, step `pnpm/action-setup@v5`.
- Output:
  ```
  Error: Multiple versions of pnpm specified:
    - version 9 in the GitHub Action config with the key "version"
    - version pnpm@9.0.0 in the package.json with the key "packageManager"
  ```
- Fix (tahti-org): in `.github/workflows/stack-smoke.yml` (lines ~27-29) drop the `with: version: 9` block under `pnpm/action-setup@v5` so it reads `packageManager`. Then trigger the workflow by hand (`workflow_dispatch`, if enabled) and check the later steps also pass.
- [ ] Fix the workflow in a tahti-org PR
- [ ] Green manual run of Stack smoke
