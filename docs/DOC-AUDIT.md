# Documentation quality audit — 2026-10-03

Cross-check of root README + `packages/tahti-web` docs against [`FEATURES.md`](../packages/tahti-web/FEATURES.md), [`FEATURES-REMAINING.md`](../packages/tahti-web/FEATURES-REMAINING.md), mobile reality, and sibling repos.

## Gaps found

| Severity | Claim / issue | Reality | Action |
| --- | --- | --- | --- |
| **High** | README implies polished “native clients” without mobile caveat | Desktop Tauri yes; mobile = responsive web + Android **stub** script | README platform matrix |
| **High** | “democked against the live API” wording | Most listen/studio paths are `live-api`; remaining listed in FEATURES-REMAINING | Clarified |
| **Medium** | Production monorepo called `` `tahti` `` | Canonical public name is **tahti-org** | Fixed |
| **Medium** | No platform feature matrix in README | Web / desktop / mobile maturity differs a lot | Added |
| **Medium** | CLI / registry / Discord bot invisible from root README | Real sibling packages/repos | Linked |
| **Medium** | Admin “22 surfaces” without saying production Next admin is denser | FEATURES.md: board admin partial vs Next | Noted |
| **Low** | Screenshot set uses `*-v1` redesign shots | Files exist; newer `*-current-v1` admin shots exist but listen/studio v1 still valid | Kept v1 listen/studio; admin uses current |
| **Low** | `packages/website` still Nuclear marketing copy | Separate marketing surface; not Tahti product README | Out of scope this pass |

## Screenshot inventory

| Set | Count | Used by |
| --- | --- | --- |
| `packages/tahti-web/docs/redesign-shots/` | ~217 | Root README highlights |
| `packages/tahti-web/docs/readme-shots/` | present | `packages/tahti-web/README.md` + VIEW-GUIDE |
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

- Root `README.md` — current-state table, platform matrix, honest mobile/desktop split, satellite repos, clearer feature list tied to FEATURES.md
- `docs/DOC-AUDIT.md` (this file)
