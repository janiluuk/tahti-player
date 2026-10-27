# Board-created discussion topics in tahti-web

**Status:** blocked

The API shipped in tahti-org #991–#1003 and #1011–#1012 (reply edits, paging) (plus #999 `mine`, #1000 reports, #1001 unread counts, #1002 close notices, #1003 export of opened topics): the board opens topics (`/api/admin/discussions`), members read, reply, follow, mute and remove their replies (`/api/v1/governance/discussions/...`), with `DISCUSSION_OPENED` / `DISCUSSION_REPLY` notices, data export and account deletion handled. Web: #1570, #1574–#1580, #1584, #1585, #1589, #1591–#1593; CLI: #1586, #1587. Everything below is shipped except the allowlist cleanup, which waits on a tahti-org release that publishes the new paths in `openapi.json`.

## To do (web)

- [x] Member topic list `/governance/discussions` + Governance quick link
- [x] Topic page `/governance/discussions/$id`: body, replies, reply form
- [x] Follow / mute controls on the topic page
- [x] Remove your own reply; board removes any
- [x] Admin → Governance: open a topic (title, body, pin)
- [x] Admin: pin / close / reopen a topic
- [x] Admin: edit a topic's title and body
- [x] Notification kinds mirror (`DISCUSSION_OPENED`, `DISCUSSION_REPLY` under Governance)
- [x] Storybook stories for the list and topic page; VIEW-CATALOG status
- [x] Privacy & data copy lists discussion replies and follows; Help center governance guide
- [ ] Drop the allowlisted discussion paths once tahti-org publishes a release
