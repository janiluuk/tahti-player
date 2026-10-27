# Board-created discussion topics in tahti-web

**Status:** partial

The API shipped in tahti-org #991–#998: the board opens topics (`/api/admin/discussions`), members read, reply, follow, mute and remove their replies (`/api/v1/governance/discussions/...`), with `DISCUSSION_OPENED` / `DISCUSSION_REPLY` notices, data export and account deletion handled. Web client: #1570.

## To do (web)

- [x] Member topic list `/governance/discussions` + Governance quick link
- [x] Topic page `/governance/discussions/$id`: body, replies, reply form
- [x] Follow / mute controls on the topic page
- [x] Remove your own reply; board removes any
- [x] Admin → Governance: open a topic (title, body, pin)
- [x] Admin: pin / close / reopen a topic
- [x] Admin: edit a topic's title and body
- [x] Notification kinds mirror (`DISCUSSION_OPENED`, `DISCUSSION_REPLY` under Governance)
- [ ] Storybook stories for the list and topic page; VIEW-CATALOG status
- [x] Privacy & data copy lists discussion replies and follows; Help center governance guide
- [ ] Drop the allowlisted discussion paths once tahti-org publishes a release
