# Settings modal footer: GitHub/Discord/API docs as an icon row

**Status:** open

## What the user asked for

(Later) In the settings modal's nav footer, the GitHub / Discord / API docs
links currently stack as three full-width text rows. Change them to a single
row of icon-only links along the bottom, and bump the icon size up a bit
(currently `size={14}`).

## Where

`packages/tahti-web/src/components/ConnectedSettingsModal.tsx` —
`navFooter`'s `<a href={GITHUB_REPO_URL}>` / `<a href={DISCORD_URL}>` /
`<a href={API_DOCS_URL}>` block (currently vertical `flex flex-col gap-0.5`
with icon + label text, using `footerLinkClass`). Needs a horizontal row
layout (icon-only, `aria-label`/`title` for a11y since the text label goes
away), sized above the current 14px, sitting above `SidebarBuildInfo`.
