import { BackButtonLink, Tooltip } from '@tahti-player/ui';

/** Round back arrow at the top of a sub-page, named for its parent (tooltip
 * and accessible name). The top bar's back arrow follows browser history,
 * which is empty on a fresh tab or a shared link; this always leads to the
 * page's parent. */
export function PageBackLink({
  to,
  params,
  search,
  label,
}: {
  to: string;
  params?: Record<string, string>;
  search?: Record<string, string>;
  label: string;
}) {
  return (
    <Tooltip content={label} side="right">
      <BackButtonLink
        className="bg-background-secondary hover:bg-background-secondary/80 size-10 w-fit"
        to={to as never}
        params={params as never}
        search={search as never}
        aria-label={label}
        data-testid="page-back-link"
      />
    </Tooltip>
  );
}
