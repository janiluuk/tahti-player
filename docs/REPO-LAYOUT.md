# Repository layout

What lives at the repo root and why. Code is in `packages/` (see [`AGENTS.md`](../AGENTS.md) → Packages); this page covers everything else.

## Root files

Only files that a tool requires at the root, or that people expect there, stay at the root.

| File | What it is | Why it stays at the root |
| --- | --- | --- |
| `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml` | pnpm workspace: root scripts, the `packages/*` glob, allowed build scripts, the committed lockfile | pnpm looks for them at the workspace root |
| `turbo.json` | Turborepo task graph | Turborepo reads it from the root |
| `tsconfig.json`, `eslint.config.ts`, `prettier.config.js`, `.prettierignore` | Shared TypeScript, ESLint and Prettier config | Editors and the CLIs search upward from each file |
| `.node-version`, `.nvmrc` | Node 24 pin, once for fnm/volta/setup-node and once for nvm | Version managers read them from the root |
| `.gitignore`, `.gitattributes` | Git config | Git |
| `README.md`, `LICENSE`, `THIRD_PARTY_NOTICES` | Project front page and licensing | Convention, GitHub |
| `AGENTS.md`, `AGENTS-START-HERE.md`, `CLAUDE.md`, `TAHTI.md` | Agent instructions and the Tahti cutover overview | Agents load them from the root |

## Root directories

| Directory | What it is |
| --- | --- |
| `packages/` | The workspace packages |
| `docs/` | Maintainer and agent docs (the user guide is `packages/docs`) |
| `scripts/` | Repo scripts: build-and-run helpers, `ci/` helpers used by workflows, release scripts for AUR and Flathub |
| `packaging/` | Distribution packaging, see below |
| `snap/` | Snapcraft project (`snap/snapcraft.yaml`). Snapcraft only finds it at `snap/` in the project root, so it can't move into `packaging/` |
| `examples/` | Example third-party plugin |
| `.github/` | Workflows, composite actions, issue templates, and the config files of GitHub-integrated services (below) |
| `.husky/` | Git hooks (pre-commit runs lint-staged) |
| `.agents/`, `.cursor/`, `.vscode/` | Agent skills, Cursor rules and cloud environment, editor settings |

Ignored local directories you may see: `node_modules/`, `.turbo/`, `snapshot-digest/` (output of `pnpm snapshot-digest`), `.keys/` (local Tauri signing keys, never commit).

## `packaging/`

| Path | What it is | Used by |
| --- | --- | --- |
| `packaging/aur/tahti-player-bin/PKGBUILD.template` | AUR `tahti-player-bin` PKGBUILD | `scripts/update-aur.sh` ← `.github/workflows/update-aur.yml` |
| `packaging/flatpak/live.tahti.player.yml` | Flatpak manifest for local from-source builds (`flatpak-builder ... packaging/flatpak/live.tahti.player.yml`) | Manual |
| `packaging/flatpak/live.tahti.player.yml.template` | Flathub manifest, filled with tag/commit/pnpm version | `scripts/flatpak-update-flathub.sh` ← `.github/workflows/update-flathub.yml` |
| `packaging/flatpak/icons/` | App icons; the snap installs the 512px one too | Flatpak manifests, `snap/snapcraft.yaml` |
| `packages/tahti-web/Dockerfile.test` | Runs the tahti-web Vitest suite in CI's Node + pnpm setup. Build from the repo root: `docker build -f packages/tahti-web/Dockerfile.test .`; `Dockerfile.test.dockerignore` keeps host `node_modules` out of the build context | Manual |

`scripts/flatpak-generate-sources.sh` writes `pnpm-sources.json` and `cargo-sources.json` into `packaging/flatpak/`; they are gitignored.

## Service config in `.github/`

These services find their config in `.github/` as well as the root, so it lives there.

| File | Service |
| --- | --- |
| `.github/codecov.yml` | Codecov: coverage targets, per-package components, ignored paths. Uploads come from `.github/workflows/coverage.yml` |
| `.github/renovate.json` | Renovate: weekly dependency PRs and package grouping |
| `.github/FUNDING.yml` | GitHub Sponsors button |
| `.github/copilot-instructions.md` | Copilot agent instructions |
