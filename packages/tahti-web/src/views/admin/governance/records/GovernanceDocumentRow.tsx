import { useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Badge,
  Button,
  EditIconButton,
  ExternalLink,
  InlineError,
  Input,
} from '@tahti-player/ui';

import { patchAdminGovernanceDocument } from '../../../../api/admin/admin-governance-documents';
import type { GovernanceDocument } from '../../../../api/types';
import { LegalHoldControl } from './LegalHoldControl';

/** One governance document in the board's list: link, version, state,
 * rename, archive/restore and its legal hold. */
export function GovernanceDocumentRow({
  document,
  onChanged,
}: {
  document: GovernanceDocument;
  onChanged?: (document: GovernanceDocument) => void;
}) {
  const { t } = useTranslation('web');
  const href = document.downloadUrl ?? document.externalUrl ?? undefined;
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(document.title);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const label = `${document.title} v${document.version}`;

  const save = (change: { archived?: boolean; title?: string }) => {
    setBusy(true);
    setError(null);
    void patchAdminGovernanceDocument(document, change).then((result) => {
      setBusy(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setRenaming(false);
      onChanged?.(result.data);
    });
  };

  return (
    <li className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <span>
          {href ? (
            <ExternalLink
              href={href}
              className="no-underline underline-offset-2 hover:underline"
            >
              {document.title}
            </ExternalLink>
          ) : (
            document.title
          )}{' '}
          · v{document.version} ·{' '}
          {document.publishedAt
            ? t('governanceDocumentRowStates.published')
            : t('governanceDocumentRowStates.draft')}
        </span>
        {document.archivedAt ? (
          <Badge variant="pill" color="secondary">
            {t('governanceDocumentRow.archived')}
          </Badge>
        ) : null}
        <EditIconButton
          disabled={busy}
          label={t('governanceDocumentRowLabels.renameLabel', { label })}
          onClick={() => setRenaming(true)}
        />
        <Button
          size="xs"
          variant="secondary"
          disabled={busy}
          aria-label={
            document.archivedAt
              ? t('governanceDocumentRowStates.restoreItem', { label })
              : t('governanceDocumentRowStates.archiveItem', { label })
          }
          onClick={() => save({ archived: !document.archivedAt })}
        >
          {document.archivedAt
            ? t('governanceDocumentRowStates.restore')
            : t('governanceDocumentRowStates.archive')}
        </Button>
      </div>
      {renaming ? (
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            save({ title });
          }}
        >
          <Input
            label={t('governanceDocumentRow.title')}
            value={title}
            maxLength={200}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Button type="submit" size="sm" disabled={busy}>
            {t('governanceDocumentRow.saveTitle')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={busy}
            onClick={() => setRenaming(false)}
          >
            {t('governanceDocumentRow.cancel')}
          </Button>
        </form>
      ) : null}
      {error ? <InlineError textSize="xs">{error}</InlineError> : null}
      <LegalHoldControl
        kind="document"
        id={document.id}
        title={label}
        legalHoldAt={document.legalHoldAt}
        legalHoldReason={document.legalHoldReason}
      />
    </li>
  );
}
