# Add-on presentation audit — 2026-09-05

- Shared PluginStoreItem, PluginItem and ThemeStoreItem inherit the active
  add-on category and keep their existing status/capability labels. Explicit
  duplicate category labels are removed.
- Listen widget configuration now opens the shared Dialog rather than an
  inline Box. Existing settings and save handlers stay in the modal.
- Last.fm connection starts from a Configure modal. Connected Last.fm and
  ListenBrainz retain an accessible Configure action.
- Add-on list/dialog actions use shared Button controls; replaced bare radio
  row buttons and text variants in the store, listener widgets and scrobblers.
- Updated Storybook's plain-text Configure accessory to the shared icon button
  and added category labels to the PluginItem example.

Validation covers shared card behavior and app checks. Live provider connection
tests still need configured provider accounts and are not implied by this UI audit.
