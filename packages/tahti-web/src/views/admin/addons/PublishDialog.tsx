import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Button,
  Dialog,
  FilePicker,
  InlineError,
  Input,
  Textarea,
} from '@tahti-player/ui';

import {
  ADDON_BUNDLE_MAX_BYTES,
  ADDON_VERSION_PATTERN,
  type AdminAddon,
  type AdminAddonPublishInput,
} from '../../../api/admin';
import { nextPatchVersion } from './shared';

function formatSize(bytes: number): string {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
}

export function PublishDialog({
  addon,
  pending,
  error,
  onCancel,
  onPublish,
}: {
  addon: AdminAddon | null;
  pending: boolean;
  error: string | null;
  onCancel: () => void;
  onPublish: (addon: AdminAddon, input: AdminAddonPublishInput) => void;
}) {
  const { t } = useTranslation('web');
  const [version, setVersion] = useState('');
  const [changelog, setChangelog] = useState('');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (addon) {
      setVersion(nextPatchVersion(addon.currentVersion));
      setChangelog('');
      setFile(null);
    }
  }, [addon]);

  const versionValid = ADDON_VERSION_PATTERN.test(version.trim());
  const tooBig = file !== null && file.size > ADDON_BUNDLE_MAX_BYTES;

  return (
    <Dialog.Root
      isOpen={addon !== null}
      onClose={onCancel}
      className="max-w-lg"
    >
      <Dialog.Title>Publish a version of {addon?.name}</Dialog.Title>
      <Dialog.Description>
        {t('addonPublish.uploadTheWidgetAposS')}
      </Dialog.Description>
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (addon && file && versionValid && !tooBig) {
            onPublish(addon, { version, changelog, file });
          }
        }}
      >
        <Input
          label={t('addonPublish.version')}
          value={version}
          placeholder="1.0.0"
          error={version && !versionValid ? 'Use the form 1.0.0' : undefined}
          onChange={(event) => setVersion(event.target.value)}
        />
        <FilePicker
          accept=".js,.mjs,application/javascript,text/javascript"
          disabled={pending}
          labels={{
            title: t('publishDialogFields.widgetBundle'),
            description: file
              ? `${file.name} · ${formatSize(file.size)}`
              : 'A single .js or .mjs file.',
            browse: file ? 'Choose another file' : 'Choose bundle',
          }}
          onFiles={(files) => setFile(files[0] ?? null)}
        />
        {tooBig ? (
          <InlineError>
            This file is {formatSize(file.size)}; bundles can be at most 2 MB.
          </InlineError>
        ) : null}
        <Textarea
          submitOnModEnter
          label={t('addonPublish.changelogOptional')}
          value={changelog}
          rows={3}
          maxLength={2000}
          placeholder={t('addonPublish.whatChangedInThisVersion')}
          onChange={(event) => setChangelog(event.target.value)}
        />
        {error ? <InlineError>{error}</InlineError> : null}
        <Dialog.Actions>
          <Dialog.Close>{t('addonPublish.cancel')}</Dialog.Close>
          <Button
            type="submit"
            disabled={pending || !file || !versionValid || tooBig}
          >
            {pending ? 'Publishing…' : 'Publish for review'}
          </Button>
        </Dialog.Actions>
      </form>
    </Dialog.Root>
  );
}
