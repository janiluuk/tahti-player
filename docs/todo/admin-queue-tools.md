# Admin queue tools

**Status:** open

Goal: Admin can see and manage the background job queues: what is being
processed now, what is waiting, what failed, and act on it.

Why now: on 2026-11-10 (03:07–03:22 UTC) 67 yaniho uploads finished (file and
size stored) but their transcode jobs never ran. They are still `PENDING` with
no `mp3Key`, and nothing can recover them: `POST /api/me/sound/:id/retry-processing`
only accepts `ERROR`, and no sweep re-queues stuck `PENDING` sounds.

Existing pieces:

- tahti-web: Admin → Status → `views/admin/status/WorkersPanel.tsx` (lanes such as transcode and waveform, from `api/admin/admin-workers.ts`).
- tahti-org: `apps/api/src/lib/queue.ts` (`enqueueTranscode`), worker jobs in `apps/worker/src/jobs/`.

Plan:

1. API (tahti-org): per queue, list active / waiting / delayed / failed / recently completed jobs with the item they work on (sound title, owner), age and attempts; paged.
2. API actions: retry a failed job, remove a job, pause/resume a queue, re-queue a sound's processing.
3. Stuck items: list sounds `PENDING` with a stored file and no job for over an hour; re-queue one or all. Let `retry-processing` accept such sounds too, and add a worker sweep that re-queues them.
4. Admin UI (tahti-web): a Queues page under Admin → Status with tabs per state, live counts, the items now processing, and the actions above (destructive ones confirm in red).
5. Find why the 2026-11-10 jobs were lost (worker logs in Loki on 192.168.2.106, `component: transcode`, e.g. sound `cmwa4i3c2002t1r8yx87t8bw3`).
6. Tests for each endpoint and the page; Storybook story for the Queues page.
