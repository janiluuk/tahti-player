# Rename Sound to Library in the UI

**Status:** open

Requested by the user; implementation pending.

## Requirements

- [ ] Use “Library” consistently as the name of the section currently referred to as “Sound”.
- [ ] Audit navigation, headings, buttons, links, empty states, help text, tooltips, and accessibility labels for references to the section.
- [ ] Replace prompts such as “Go to Sound” with “Go to Library”, keeping their destination correct.
- [ ] Update relevant translations, Storybook stories, tests, and view catalog entries to match the terminology.

## Verification

- [ ] Confirm no user-facing references to the section still call it “Sound”. Ordinary uses of the word sound describing audio are outside this rename.
- [ ] Verify renamed navigation and CTA links still open the intended Library view.
