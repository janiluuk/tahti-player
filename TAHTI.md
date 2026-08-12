# Tahti Nuclear Player — project notes

Tahti Nuclear Player is built on [nukeop/nuclear](https://github.com/nukeop/nuclear) (AGPL-3.0).

It is **not** the upstream Nuclear project. Do not open Nuclear PRs from this tree without cherry-picking onto a clean upstream branch.

## Remotes

| Remote | URL | Role |
|--------|-----|------|
| `origin` | `https://github.com/janiluuk/tahti-nuclear.git` | Tahti Nuclear Player (push here) |
| `upstream` | `https://github.com/nukeop/nuclear.git` | Nuclear upstream (fetch/rebase only) |

Create the GitHub repo once (empty), then:

```bash
cd /home/jani/workspace/tahti-nuclear
gh auth login   # if needed
gh repo create janiluuk/tahti-nuclear --private --source=. --remote=origin --push
# or: git push -u origin master
```

Sync upstream later:

```bash
git fetch upstream
git rebase upstream/master   # or merge
```

## Tahti package

- **`packages/tahti-web`** — listen/studio POC on Nuclear UI → public Tahti API
- Dev: `pnpm dev:tahti` (Node 22+)
- Offline: `VITE_FORCE_MOCK=1 pnpm dev:tahti`
- Deploy beta: `pnpm deploy:tahti-beta` → vimage `:15180` / `beta.tahti.live`
- Docs: `packages/tahti-web/MOCKS.md`, `packages/tahti-web/deploy/README.md`
- Local planning (gitignored): `tahti-fit/`

## Detached from `/home/jani/workspace/nuclear`

The pristine upstream clone at `~/workspace/nuclear` should track `nukeop/nuclear` only. All Tahti work lives **here**.
