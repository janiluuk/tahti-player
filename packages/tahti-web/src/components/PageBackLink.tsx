import { ArrowLeftIcon } from 'lucide-react';

import { ButtonLink } from '@tahti-player/ui';

/** "← Parent" link at the top of a sub-page. The top bar's back arrow
 * follows browser history, which is empty on a fresh tab or a shared link;
 * this always leads to the page's parent. */
export function PageBackLink({
  to,
  search,
  label,
}: {
  to: string;
  search?: Record<string, string>;
  label: string;
}) {
  return (
    <ButtonLink
      className="w-fit"
      to={to as never}
      search={search as never}
      size="xs"
      variant="text"
      data-testid="page-back-link"
    >
      <ArrowLeftIcon size={14} aria-hidden className="mr-1" />
      {label}
    </ButtonLink>
  );
}
