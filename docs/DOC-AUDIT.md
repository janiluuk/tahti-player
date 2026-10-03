# Documentation quality audit — 2026-10-03

Cross-check of root README + `packages/tahti-web` docs against [`FEATURES.md`](../packages/tahti-web/FEATURES.md), [`FEATURES-REMAINING.md`](../packages/tahti-web/FEATURES-REMAINING.md), mobile reality, and sibling repos.

Follow-up pass: pnpm pin, desktop installer honesty, package README run instructions.

## Gaps found

| Severity | Claim / issue | Reality | Action |
| --- | --- | --- | --- |
| **High** | README implies polished “native clients” without mobile caveat | Desktop Tauri yes; mobile = responsive web + Android **stub** | Platform matrix |
| **High** | Docs said `pnpm@10.33.4` | `packageManager` is **`pnpm@12.5.1`** | README + AGENTS.md fixed |
| **Medium** | “Ships for Windows / macOS / Linux” absolute | Depends on published CI release assets | Softened |
| **Medium** | `packages/tahti-web/README` `pnpm dev` | Root `pnpm dev` is desktop filters; web is `pnpm dev:tahti` | Fixed |
| **Medium** | Production monorepo called `` `tahti` `` | Canonical name **tahti-org** | Fixed |
| **Medium** | No platform feature matrix | Web / desktop / mobile maturity differs | Added |
| **Medium** | Admin “22 surfaces” without Next denser note | Board admin partial vs Next | Noted |
| **Low** | Pro editor marketed as full DAW | Trim/EQ/dynamics/revisions; multitrack remaining | Clarified in feature list |
| **Low** | `packages/website` Nuclear marketing copy | Out of scope | Left |

## Screenshot inventory

| Set | Count | Used by |
| --- | --- | --- |
| `packages/tahti-web/docs/redesign-shots/` | ~217 | Root README highlights |
| `packages/tahti-web/docs/readme-shots/` | present | Package README + VIEW-GUIDE |
| `packages/tahti-web/docs/VIEW-GUIDE.md` | generated gallery | Full screen index |

All root README `<picture>` paths resolve.

## Source-of-truth map

| Question | Read |
| --- | --- |
| Prod parity matrix | `packages/tahti-web/FEATURES.md` |
| Open gaps only | `packages/tahti-web/FEATURES-REMAINING.md` |
| Cutover | `packages/tahti-web/CUTOVER.md` + tahti-org `ops/nuclear-web-cutover.md` |
| Platform API / constitution | [tahti-org](https://github.com/janiluuk/tahti-org) |

## Rewrite done in this pass

- Root `README.md` — current-state table, platform matrix, honest mobile/desktop split, pnpm 12.5.1, satellite repos
- `AGENTS.md` — pnpm pin
- `packages/tahti-web/README.md` — `dev:tahti` / filter instructions
- `docs/DOC-AUDIT.md` (this file)
