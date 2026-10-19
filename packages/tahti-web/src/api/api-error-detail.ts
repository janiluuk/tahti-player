export type ApiErrorBody = {
  error?: string;
  message?: string;
  issues?: Array<{ path?: Array<string | number>; message?: string }>;
};

/** Human-readable message from an API error body: validation `issues` first
 * (`field: message · …`), then `error` / `message`, else `fallback`. */
export function apiErrorDetail(body: ApiErrorBody, fallback: string): string {
  const parts = (body.issues ?? [])
    .map((issue) => {
      const field = Array.isArray(issue.path)
        ? issue.path.filter((part) => part !== 'body').join('.')
        : '';
      const message = issue.message?.trim();
      if (!message) {
        return null;
      }
      return field ? `${field}: ${message}` : message;
    })
    .filter((part): part is string => Boolean(part));
  if (parts.length) {
    return parts.join(' · ');
  }
  return body.error ?? body.message ?? fallback;
}
