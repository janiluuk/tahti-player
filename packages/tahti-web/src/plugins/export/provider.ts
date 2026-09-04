/**
 * Behavioral DSP export adapter — submit / status against sibling
 * `GET /api/me/export-plugins` paths. Deep-link-only catalog rows stay as
 * `ExportTarget` metadata until they gain real routes.
 */

export type ExportSubmitResult =
  | { ok: true; status: string }
  | { ok: false; error: string };

export type ExportStatusResult =
  | {
      ok: true;
      revelatorId: string | null;
      revelatorStatus: string | null;
      title: string;
    }
  | { ok: false; error: string };

export type ExportProvider = {
  id: string;
  label: string;
  /** True when submit/status hit live API paths from the export-plugins registry. */
  behavioral: boolean;
  submit: (releaseId: string) => Promise<ExportSubmitResult>;
  status: (releaseId: string) => Promise<ExportStatusResult>;
};
