export type ExportSubmitResult =
  { ok: true; status: string } | { ok: false; error: string };

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
  behavioral: boolean;
  submit: (releaseId: string) => Promise<ExportSubmitResult>;
  status: (releaseId: string) => Promise<ExportStatusResult>;
};
