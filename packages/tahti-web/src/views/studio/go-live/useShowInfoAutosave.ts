import { useCallback, useEffect, useRef, useState } from 'react';

import {
  BROADCAST_TAGLINE_MAX,
  BROADCAST_TITLE_MAX,
  patchBroadcastPreflight,
  type BroadcastPreflight,
  type BroadcastPreflightPatch,
} from '../../../api/broadcast';

export type ShowInfoFields = {
  title: string;
  tagline: string;
  showType: BroadcastPreflight['showType'];
  visibility: BroadcastPreflight['visibility'];
  seriesId: string;
};

export type ShowInfoField = keyof ShowInfoFields;

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export type ShowInfoFieldErrors = {
  title?: 'required' | 'tooLong';
  tagline?: 'tooLong';
};

export const AUTOSAVE_DELAY_MS = 800;

export function showInfoFieldsFrom(
  preflight: BroadcastPreflight,
): ShowInfoFields {
  return {
    title: preflight.title ?? '',
    tagline: preflight.tagline ?? preflight.plannedRadioShow?.tagline ?? '',
    showType: preflight.showType,
    visibility: preflight.visibility,
    seriesId: preflight.seriesId ?? preflight.plannedLiveShow?.seriesId ?? '',
  };
}

function wireValue(field: ShowInfoField, values: ShowInfoFields) {
  switch (field) {
    case 'title':
      return values.title.trim();
    case 'tagline':
      return values.tagline.trim() || null;
    case 'seriesId':
      return values.seriesId || null;
    default:
      return values[field];
  }
}

export function validateShowInfo(values: ShowInfoFields): ShowInfoFieldErrors {
  const errors: ShowInfoFieldErrors = {};
  const title = values.title.trim();
  if (!title) {
    errors.title = 'required';
  } else if (title.length > BROADCAST_TITLE_MAX) {
    errors.title = 'tooLong';
  }
  if (values.tagline.trim().length > BROADCAST_TAGLINE_MAX) {
    errors.tagline = 'tooLong';
  }
  return errors;
}

/** Local show-info edits saved as partial PATCHes: text fields on blur,
 * selects on change, debounced so a quick run of edits is one request. */
export function useShowInfoAutosave({
  preflight,
  onSaved,
  delayMs = AUTOSAVE_DELAY_MS,
}: {
  preflight: BroadcastPreflight | null;
  onSaved: (preflight: BroadcastPreflight) => void;
  delayMs?: number;
}) {
  const [values, setValues] = useState<ShowInfoFields | null>(() =>
    preflight ? showInfoFieldsFrom(preflight) : null,
  );
  const [status, setStatus] = useState<AutosaveStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ShowInfoFieldErrors>({});

  const valuesRef = useRef(values);
  valuesRef.current = values;
  const pending = useRef<BroadcastPreflightPatch>({});
  const failed = useRef<BroadcastPreflightPatch | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editedWhileSaving = useRef(new Set<ShowInfoField>());
  const saving = useRef(false);
  const onSavedRef = useRef(onSaved);
  onSavedRef.current = onSaved;

  useEffect(() => {
    if (!preflight) {
      return;
    }
    const server = showInfoFieldsFrom(preflight);
    setValues((current) => {
      if (!current) {
        return server;
      }
      const next = { ...server };
      for (const field of editedWhileSaving.current) {
        (next as Record<ShowInfoField, unknown>)[field] = current[field];
      }
      for (const field of Object.keys(pending.current) as ShowInfoField[]) {
        if (field in current) {
          (next as Record<ShowInfoField, unknown>)[field] = current[field];
        }
      }
      return next;
    });
  }, [preflight]);

  const send = useCallback(async (patch: BroadcastPreflightPatch) => {
    saving.current = true;
    editedWhileSaving.current = new Set();
    setStatus('saving');
    setError(null);
    const result = await patchBroadcastPreflight(patch);
    saving.current = false;
    if ('error' in result) {
      failed.current = patch;
      setStatus('error');
      setError(result.error);
      return;
    }
    failed.current = null;
    setStatus('saved');
    onSavedRef.current(result.data);
  }, []);

  const flush = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    const patch = pending.current;
    pending.current = {};
    if (Object.keys(patch).length === 0) {
      return;
    }
    void send(patch);
  }, [send]);

  const schedule = useCallback(
    (patch: BroadcastPreflightPatch, immediate = false) => {
      pending.current = { ...pending.current, ...patch };
      if (timer.current) {
        clearTimeout(timer.current);
      }
      if (immediate) {
        flush();
        return;
      }
      timer.current = setTimeout(flush, delayMs);
    },
    [delayMs, flush],
  );

  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
        const patch = pending.current;
        pending.current = {};
        if (Object.keys(patch).length > 0) {
          void patchBroadcastPreflight(patch);
        }
      }
    },
    [],
  );

  const edit = useCallback(
    <K extends ShowInfoField>(field: K, value: ShowInfoFields[K]) => {
      if (saving.current) {
        editedWhileSaving.current.add(field);
      }
      setValues((current) =>
        current ? { ...current, [field]: value } : current,
      );
      setFieldErrors((current) =>
        field in current ? { ...current, [field]: undefined } : current,
      );
    },
    [],
  );

  /** Queues the given fields if they differ from the saved show info. */
  const commit = useCallback(
    (fields: ShowInfoField[], next?: Partial<ShowInfoFields>) => {
      const current = valuesRef.current;
      if (!current || !preflight) {
        return;
      }
      const merged = { ...current, ...next };
      const baseline = showInfoFieldsFrom(preflight);
      const errors = validateShowInfo(merged);
      setFieldErrors((existing) => {
        const updated = { ...existing };
        for (const field of fields) {
          if (field === 'title' || field === 'tagline') {
            updated[field] = errors[field] as never;
          }
        }
        return updated;
      });
      const patch: Record<string, unknown> = {};
      for (const field of fields) {
        if (field in errors && errors[field as keyof ShowInfoFieldErrors]) {
          continue;
        }
        const value = wireValue(field, merged);
        if (value !== wireValue(field, baseline)) {
          patch[field] = value;
        }
      }
      if (Object.keys(patch).length > 0) {
        schedule(patch as BroadcastPreflightPatch);
      }
    },
    [preflight, schedule],
  );

  const retry = useCallback(() => {
    const patch = failed.current;
    if (patch) {
      schedule(patch, true);
    }
  }, [schedule]);

  return {
    values,
    status,
    error,
    fieldErrors,
    edit,
    commit,
    /** Saves a patch now, e.g. the cover right after its upload. */
    saveNow: (patch: BroadcastPreflightPatch) => schedule(patch, true),
    retry,
  };
}
