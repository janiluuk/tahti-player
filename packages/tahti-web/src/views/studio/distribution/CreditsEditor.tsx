import { PlusIcon, Trash2Icon } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, Input, Select, Tooltip } from '@tahti-player/ui';

import type {
  ReleaseCredit,
  ReleaseCreditRole,
} from '../../../api/studio-types';
import { RELEASE_CREDIT_ROLES } from '../../../api/studio-types';
import { PageEmpty } from '../../../components/PageStates';

export function CreditsEditor({
  credits,
  setCredits,
  busy,
}: {
  credits: ReleaseCredit[];
  setCredits: (credits: ReleaseCredit[]) => void;
  busy: boolean;
}) {
  const { t } = useTranslation('web');
  const addCredit = () =>
    setCredits([...credits, { role: 'writer', name: '' }]);
  return (
    <div>
      <p className="mb-2 text-xs font-medium">
        {t('creditsEditor.creditsRoles')}
      </p>
      {credits.length === 0 && (
        <PageEmpty
          title={t('empties.noDistributionCredits')}
          action={
            <Button
              size="sm"
              variant="secondary"
              disabled={busy}
              onClick={addCredit}
            >
              <PlusIcon size={16} aria-hidden />
              {t('emptyActions.addCredit')}
            </Button>
          }
        />
      )}
      <ul className="flex flex-col gap-2">
        {credits.map((credit, index) => (
          <li
            key={index}
            className="grid gap-2 sm:grid-cols-[8rem_1fr_8rem_auto]"
          >
            <Select
              className="text-xs"
              options={RELEASE_CREDIT_ROLES.map((role) => ({
                id: role,
                label: role,
              }))}
              value={credit.role}
              disabled={busy}
              label={t('creditsEditor.creditRole')}
              onValueChange={(role) => {
                const next = [...credits];
                next[index] = {
                  ...credit,
                  role: role as ReleaseCreditRole,
                };
                setCredits(next);
              }}
            />
            <Input
              value={credit.name}
              placeholder={t('creditsEditor.name')}
              disabled={busy}
              aria-label={t('creditsEditor.creditName')}
              onChange={(e) => {
                const next = [...credits];
                next[index] = { ...credit, name: e.target.value };
                setCredits(next);
              }}
            />
            <Input
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={credit.artistUsername ? `@${credit.artistUsername}` : ''}
              placeholder="@username"
              disabled={busy}
              maxLength={33}
              aria-label={t('creditsEditor.tahtiUsername')}
              onChange={(e) => {
                const raw = e.target.value
                  .trim()
                  .replace(/^@/, '')
                  .toLowerCase();
                const next = [...credits];
                next[index] = {
                  ...credit,
                  artistUsername: raw.length > 0 ? raw : undefined,
                };
                setCredits(next);
              }}
            />
            <Tooltip content={t('creditsEditor.removeCredit')} side="top">
              <Button
                size="icon-sm"
                variant="text"
                disabled={busy}
                aria-label={`Remove credit ${credit.name || index + 1}`}
                onClick={() =>
                  setCredits(credits.filter((_, i) => i !== index))
                }
              >
                <Trash2Icon className="text-accent-red" size={14} aria-hidden />
              </Button>
            </Tooltip>
          </li>
        ))}
      </ul>
      {credits.length > 0 && (
        <Button
          size="sm"
          variant="secondary"
          className="mt-2"
          disabled={busy}
          onClick={addCredit}
        >
          <PlusIcon size={14} aria-hidden className="mr-1.5" />
          {t('emptyActions.addCredit')}
        </Button>
      )}
    </div>
  );
}
