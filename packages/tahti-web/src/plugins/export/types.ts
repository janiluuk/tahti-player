/**
 * A place a release or track can be pushed out to.
 *
 * Catalog tiles remain `ExportTarget` metadata (deep links into Studio
 * distribution / Sources). Behavioral submit/status lives on
 * `ExportProvider` (`provider.ts` / `revelator.ts`) against sibling
 * `GET /api/me/export-plugins` — see ../tahti docs/technical/export-plugin-contracts.md.
 */
export type ExportTarget = {
  id: string;
  label: string;
  note: string;
  color: string;
  to: string;
  supportsTracks: boolean;
};
