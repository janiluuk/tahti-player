import { PlusIcon, SaveIcon } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Button,
  Dialog,
  InlineError,
  Input,
  Select,
  Textarea,
} from '@tahti-player/ui';

import {
  type AdminAddonRegisterInput,
  type AdminAddonScope,
} from '../../../api/admin';
import { ImageUploadField } from '../../../components/ImageUploadField';
import { SCOPES } from './shared';

/** Registers a new add-on, or with `editing` edits one's metadata (slug and
 * type are fixed once registered). */
export function RegisterDialog({
  editing = null,
  isOpen,
  draft,
  pending,
  error,
  onChange,
  onClose,
  onSave,
}: {
  editing?: string | null;
  isOpen: boolean;
  draft: AdminAddonRegisterInput;
  pending: boolean;
  error: string | null;
  onChange: (next: AdminAddonRegisterInput) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const { t } = useTranslation('web');
  return (
    <Dialog.Root isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <Dialog.Title>
        {editing ? `Edit ${editing}` : 'Register a new add-on'}
      </Dialog.Title>
      <Dialog.Description>
        {editing
          ? t('registerDialogStates.changesTheNameDescriptionAuthor')
          : t('registerDialogStates.createsADraftAddOn')}
      </Dialog.Description>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSave();
        }}
      >
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              label={t('addonRegister.slug')}
              value={draft.slug}
              placeholder="live-status"
              disabled={editing !== null}
              onChange={(event) =>
                onChange({ ...draft, slug: event.target.value })
              }
              description={t('addonRegister.lowercaseLettersNumbersAndHyphens')}
            />
            <Select
              label={t('addonRegister.addOnType')}
              value={draft.scope}
              disabled={editing !== null}
              onValueChange={(value) =>
                onChange({ ...draft, scope: value as AdminAddonScope })
              }
              options={SCOPES.map((scope) => ({
                id: scope.id,
                label: scope.label,
              }))}
            />
          </div>
          <Input
            autoComplete="off"
            label={t('addonRegister.name')}
            value={draft.name}
            placeholder={t('addonRegister.liveStatus')}
            onChange={(event) =>
              onChange({ ...draft, name: event.target.value })
            }
          />
          <Textarea
            submitOnModEnter
            label={t('addonRegister.description')}
            value={draft.description}
            rows={3}
            placeholder={t('addonRegister.whatDoesThisAddOn')}
            onChange={(event) =>
              onChange({ ...draft, description: event.target.value })
            }
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t('addonRegister.author')}
              value={draft.authorName}
              placeholder="Tahti"
              onChange={(event) =>
                onChange({ ...draft, authorName: event.target.value })
              }
            />
            <ImageUploadField
              label={t('addonRegister.addOnCover')}
              description={t('addonRegister.jpegPngWebpOrGif')}
              value={draft.iconUrl ?? ''}
              onChange={(iconUrl) => onChange({ ...draft, iconUrl })}
            />
          </div>
          <Input
            label={t('addonRegister.parametersCategories')}
            value={draft.categories.join(', ')}
            placeholder="stats, social, events"
            description={t('addonRegister.commaSeparatedCategoriesUsedTo')}
            onChange={(event) =>
              onChange({
                ...draft,
                categories: event.target.value
                  .split(',')
                  .map((category) => category.trim())
                  .filter(Boolean),
              })
            }
          />
          {error ? <InlineError>{error}</InlineError> : null}
        </div>
        <Dialog.Actions>
          <Dialog.Close>{t('addonRegister.cancel')}</Dialog.Close>
          <Button
            disabled={
              pending ||
              !draft.slug.trim() ||
              !draft.name.trim() ||
              !draft.description.trim() ||
              !draft.authorName.trim() ||
              draft.categories.length === 0
            }
            type="submit"
          >
            {editing ? (
              <>
                <SaveIcon size={15} aria-hidden className="mr-1.5" />
                {t('addonRegister.saveChanges')}
              </>
            ) : (
              <>
                <PlusIcon size={15} aria-hidden className="mr-1.5" />
                {t('addonRegister.registerAddOn')}
              </>
            )}
          </Button>
        </Dialog.Actions>
      </form>
    </Dialog.Root>
  );
}
