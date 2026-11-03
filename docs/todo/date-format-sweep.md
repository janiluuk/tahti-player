# One date style everywhere

**Status:** partial

Rule (user, 2026-11-03): listings show a humanized date inside a week ("3 hours ago", "2 days ago") and `d.m.yyyy` after that, with a clock icon instead of the word "on".

Done: `lib/relativeDate.ts` (`relativeDate`, `numericDate`); `storyDate` and `humanizePastDate` delegate to it; story/news/RSS cards and track rows use it with a clock icon.

Left:
- [ ] Replace the remaining one-off `toLocaleDateString` / `toLocaleString` calls in listings (about 80 files; `rg "toLocaleDateString|toLocaleString\(" packages/tahti-web/src`). Keep full timestamps only where the exact time matters (schedules, logs, admin audit).
