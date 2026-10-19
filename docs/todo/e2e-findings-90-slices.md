# E2E findings — 90 micro-slices (batch 3)

**Status:** partial

Ledger for the third findings pass (stacked on batch 1–2). Each line is one
shipped micro-edit; product findings are now checked in
`e2e-run-findings.md`. Only blocked ops/fixtures remain there.

## CSP / radio (1–14)

1. nginx SPA `script-src` + `blob:`
2. nginx SPA `script-src` + `'wasm-unsafe-eval'`
3. nginx duplicate HTML location CSP mirrored
4. Extract inline theme FOUC → `public/theme-boot.js` + `<script src>`
5–8. visualizer/hcaptcha remain external/`blob` (verified no new inline inject)
9–10. unit/e2e notes deferred to follow-up if CSP still fires on beta after deploy
11–12. VIEW-CATALOG / STORYBOOK one-liners
13–14. triage + findings checkbox

## Settings URL sync (15–32)

15. `buildSettingsPath` helper
16–20. ConnectedSettingsModal section / tab / category / channel sync
21. restore path on close
22. SettingsView stays open for `/settings/$section`
23–25. branding redirect / deep-link consistency (existing redirects retained)
26–28. unit tests SettingsView + buildSettingsPath
29–32. catalog / flow / triage cleanup

## Branding IA (33–46)

33–34. Visuals → Artist branding group label
35–36. Artist branding heading + deep link
37–38. tabGroups / panel tests
39. StudioBrandingView copy
40–42. Storybook / catalog notes
43. navigationStructureStore path
44–46. e2e assert / triage / findings checkbox

## Broadcast cross-links (47–58)

47–48. Settings Broadcast → Studio note + link
49–51. Multistream / Green room → Settings Broadcast
52–54. tests/stories notes
55–58. catalog / triage

## Tab overflow (59–74)

59–63. SectionTabs / StudioNav scroll row
64–66. LibrarySectionTabs scroll
67–71. ModerationTabs scroll / aria
72–74. layout-stability / catalog / triage

## hearthis dialog (75–85)

75–78. inline configure + Uninstall in header
79–82. tests / e2e notes
83–85. Storybook / catalog / triage

## Beta hygiene (86–90)

86–87. `isPlausiblePublicName` + tests
88. On-air soft filter
89. governance history soft filter
90. findings rewrite (ops still owns beta DB scrub)
