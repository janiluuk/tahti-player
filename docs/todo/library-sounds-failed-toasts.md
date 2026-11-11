# Library Sounds failed toasts

**Status:** open

Slice 23 of the next-50 queue. Parent: [`library-management-port.md`](library-management-port.md). Checking this off does not close the parent; fold the parent when its own leftover is gone.

## Goal

Toast each failed item when a Sounds bulk action returns failed[].

## Done when

A bulk action that fails for some rows names those rows instead of failing silently.
