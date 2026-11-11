# Admin queue: retry a failed job

**Status:** open

Slice 2 of the next-50 queue. Parent: [`admin-queue-tools.md`](admin-queue-tools.md). Checking this off does not close the parent; fold the parent when its own leftover is gone.

## Goal

Retry one failed queue job from Admin.

## Done when

A failed job can be retried without restarting the worker. Confirm is not required for retry.
