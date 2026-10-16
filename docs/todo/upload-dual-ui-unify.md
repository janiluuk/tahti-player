# Unify Library / Studio upload (page vs modal)

**Status:** open  
**Source:** Artist lifecycle e2e (`…/artist-lifecycle/ISSUES.md` P1)

## Problem

`/library/upload` shows page-level staged files **and** can open a separate **Upload track** modal (“Choose audio” / Upload disabled until the modal has a file). Artists and automation both hit the dual-path confusion.

## Done when

One clear upload path (page *or* modal); no disabled Upload behind an empty modal while files are already staged on the page.
