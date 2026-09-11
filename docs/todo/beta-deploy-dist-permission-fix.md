# Beta self-hosted deploy: dist/ permission drift

**Status:** partial

## What's fixed

"Deploy tahti-web (beta, self-hosted)" was failing on every run (at least
2026-09-11T13:14, 13:29, 14:28) at the "Sync dist + deploy config locally"
step: `rsync -a --delete packages/tahti-web/dist/ /srv/tahti-beta/dist/`
hit `mkstemp ... Permission denied` for every file under
`dist/map/nuclear/`, `dist/mock/`, `dist/radio-logos/` — the static
`public/map` / `public/mock` / `public/radio-logos` assets, copied
verbatim by every build with a fresh mtime, so rsync retried (and failed)
on them every single deploy regardless of what code changed.

Workaround shipped in `.github/workflows/deploy-tahti-web-selfhosted.yml`:
build the new `dist/` next to the live one and swap it in with `mv`
(rename only needs write access on `/srv/tahti-beta` itself, not on the
old tree's contents) instead of rsync'ing into the live tree in place.
Old trees that fail to delete are left as `dist.old.<timestamp>` and
swept best-effort (`-mtime +1`) on later runs — harmless disk usage, not
a deploy blocker.

## Remaining

The underlying cause — some subdirectories under `/srv/tahti-beta/dist`
on vimage have permissions the `gha-runner` user can't write into, despite
the runner setup notes saying gha-runner owns `/srv/tahti-beta` — is not
fixed, only routed around. Needs a one-time, on-host fix (whoever has
sudo on vimage):

```
sudo chown -R gha-runner:gha-runner /srv/tahti-beta
sudo find /srv/tahti-beta -type d -exec chmod u+rwx {} +
```

After that, the accumulated `dist.old.*` backup directories under
`/srv/tahti-beta` can be removed by hand.

No SSH access was available in this session to investigate further or
confirm the chown fixes it — the workaround above should keep deploys
green regardless.
