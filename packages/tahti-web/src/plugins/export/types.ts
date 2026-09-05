/**
 * Catalog tiles remain ExportTarget metadata (deep links). Behavioral
 * submit/status lives on ExportProvider against sibling
 * GET /api/me/export-plugins — see ../tahti-org docs/technical/export-plugin-contracts.md.
 */
export type ExportTarget = {
  id: string;
  label: string;
  note: string;
  color: string;
  to: string;
  supportsTracks: boolean;
};
