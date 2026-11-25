# Map for finding hard-coded English in tahti-web

**Status:** open

Finding untranslated strings has cost a similar dig twice (2026-11-22, 2026-11-25). Write the method down once so the next batch is cheap.

## Plan

- [ ] Add a short "Finding untranslated strings" section to `docs/agent/` (or the i18n package README): the JSX grep `grep -rnE "^\s+[A-Z][a-z']+( [a-zA-Z',’-]+){2,}[^{}()=;<>]*$" packages/tahti-web/src --include=*.tsx` minus tests/stories/mocks, plus toast/placeholder/aria-label string literals.
- [ ] List what stays English on purpose: brand names, API-bound labels (render presets "Quick normalize" / "Quick auto-trim"), grouping keys ("Untitled recordings").
- [ ] Note the batch convention: new keys under a `web.<area>StringsBatchNN` block in `en_US.json` + `fi_FI.json` only (other locales have no `web` namespace).
