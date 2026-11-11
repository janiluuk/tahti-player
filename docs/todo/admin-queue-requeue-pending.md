# Re-queue stuck PENDING uploads

**Status:** open

Slice 5 of the next-50 queue. Parent: [`admin-queue-tools.md`](admin-queue-tools.md). Checking this off does not close the parent; fold the parent when its own leftover is gone.

## Goal

Re-queue sounds stuck PENDING with a stored file and no job.

## Done when

retry-processing accepts those sounds, and a sweep re-queues ones older than an hour.
