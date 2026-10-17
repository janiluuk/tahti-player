import type { GovernanceDocument } from '../../../../api/types';
import { LegalHoldControl } from './LegalHoldControl';

/** One governance document in the board's list: link, version, state and
 * its legal hold. */
export function GovernanceDocumentRow({
  document,
}: {
  document: GovernanceDocument;
}) {
  const href = document.downloadUrl ?? document.externalUrl ?? undefined;
  return (
    <li>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="underline-offset-2 hover:underline"
        >
          {document.title}
        </a>
      ) : (
        document.title
      )}{' '}
      · v{document.version} · {document.publishedAt ? 'Published' : 'Draft'}
      <LegalHoldControl
        kind="document"
        id={document.id}
        title={`${document.title} v${document.version}`}
        legalHoldAt={document.legalHoldAt}
        legalHoldReason={document.legalHoldReason}
      />
    </li>
  );
}
