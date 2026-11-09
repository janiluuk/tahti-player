import { PlusIcon, UploadIcon } from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Badge,
  BreadcrumbCurrent,
  BreadcrumbLink,
  Breadcrumbs,
  Button,
  Dialog,
  FilePicker,
  Input,
  Meter,
  Tooltip,
  ViewShell,
} from '@tahti-player/ui';

import {
  createAdminLanguage,
  fetchAdminLanguages,
  importAdminLanguageCsv,
  type AdminLanguage,
} from '../../api/admin';
import { AdminGate } from '../../components/AdminGate';
import { AdminHubBreadcrumb } from '../../components/AdminHubBreadcrumb';
import { AdminPageLayout } from '../../components/AdminNav';
import { PageError, PageLoading } from '../../components/PageStates';
import { StudioPanel } from '../../components/StudioPanel';
import { apiResult, useSnapshotFetch } from '../../lib/useSnapshotFetch';

export function AdminI18nView() {
  const { t } = useTranslation('web');
  const [newOpen, setNewOpen] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [importTarget, setImportTarget] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const snapshot = useSnapshotFetch<{
    languages: AdminLanguage[];
    unavailable: boolean;
  }>('admin-languages', async () => {
    const res = await fetchAdminLanguages();
    if (res.unavailable === true) {
      return { languages: res.data, unavailable: true };
    }
    return { languages: apiResult(res), unavailable: false };
  });
  const languages = snapshot.data?.languages ?? [];
  const unavailable = snapshot.data?.unavailable ?? false;
  const { loading, error: loadError, retry: reload } = snapshot;

  const closeNew = () => {
    setNewOpen(false);
    setCode('');
    setName('');
    setBusy(false);
  };

  const closeImport = () => {
    setImportOpen(false);
    setImportTarget(null);
  };

  const triggerImport = (langCode: string) => {
    setImportTarget(langCode);
    setImportOpen(true);
  };

  const runImport = (file: File) => {
    const target = importTarget;
    if (!target) {
      return;
    }
    setBusy(true);
    setMsg(null);
    void importAdminLanguageCsv(target, file).then((res) => {
      setBusy(false);
      closeImport();
      if (!res.ok) {
        setMsg(res.error);
        return;
      }
      setMsg(
        `Imported ${res.data.imported} rows` +
          (res.data.skipped ? `, skipped ${res.data.skipped}.` : '.'),
      );
      reload();
    });
  };

  const importLanguage = languages.find((lang) => lang.code === importTarget);

  return (
    <AdminGate>
      <div className="admin-page-layout px-1 py-2">
        <AdminPageLayout current="/admin/i18n">
          <div className="flex max-w-4xl flex-col gap-6">
            <Breadcrumbs>
              <BreadcrumbLink to="/admin">
                {t('adminI18nView.admin')}
              </BreadcrumbLink>
              <AdminHubBreadcrumb hub="platform" />
              <BreadcrumbCurrent>
                {t('adminI18nView.languages')}
              </BreadcrumbCurrent>
            </Breadcrumbs>
            <ViewShell
              title={t('adminI18nView.languages')}
              classes={{ root: 'px-0 pt-0', content: 'gap-4' }}
              actions={
                unavailable ? undefined : (
                  <Tooltip content={t('adminI18nView.newLanguage')} side="top">
                    <Button
                      size="icon-sm"
                      onClick={() => setNewOpen(true)}
                      aria-label={t('adminI18nView.newLanguage')}
                    >
                      <PlusIcon size={16} aria-hidden />
                    </Button>
                  </Tooltip>
                )
              }
            >
              {msg && (
                <p className="text-foreground-secondary text-sm" role="status">
                  {msg}
                </p>
              )}

              <StudioPanel>
                {loading ? (
                  <PageLoading label={t('loading.loadingLanguages')} />
                ) : unavailable ? (
                  <p className="text-foreground-secondary text-sm">
                    {t('adminI18nView.notAvailableYetThisServer')}
                  </p>
                ) : loadError && languages.length === 0 ? (
                  <PageError
                    title={t('loadErrors.couldNotLoadLanguages')}
                    description={loadError}
                    onRetry={reload}
                  />
                ) : (
                  <ul className="divide-border divide-y">
                    {languages.map((lang) => {
                      const pct = lang.totalKeys
                        ? Math.round(
                            (lang.translatedKeys / lang.totalKeys) * 100,
                          )
                        : 0;
                      return (
                        <li
                          key={lang.code}
                          className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm first:pt-0 last:pb-0"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium">{lang.name}</span>
                              <span className="text-foreground-secondary font-mono text-xs uppercase">
                                {lang.code}
                              </span>
                              {lang.isDefault && (
                                <Badge variant="pill" color="secondary">
                                  {t('adminI18nView.base')}
                                </Badge>
                              )}
                            </div>
                            <div className="mt-1.5 flex items-center gap-2">
                              <Meter
                                value={pct}
                                aria-label={`${lang.name} translated`}
                                className="w-32"
                              />
                              <span className="text-foreground-secondary text-xs">
                                {lang.translatedKeys}/{lang.totalKeys} ({pct}%)
                              </span>
                            </div>
                          </div>
                          {!lang.isDefault && (
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={busy}
                              onClick={() => triggerImport(lang.code)}
                            >
                              <UploadIcon
                                size={14}
                                aria-hidden
                                className="mr-1.5"
                              />
                              {t('adminI18nView.importCsv')}
                            </Button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </StudioPanel>

              <Dialog.Root isOpen={newOpen} onClose={closeNew}>
                <Dialog.Title>{t('adminI18nView.newLanguage')}</Dialog.Title>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (busy) {
                      return;
                    }
                    setBusy(true);
                    void createAdminLanguage({
                      code: code.trim().toLowerCase(),
                      name: name.trim(),
                    }).then((res) => {
                      setBusy(false);
                      if (!res.ok) {
                        setMsg(res.error);
                        return;
                      }
                      closeNew();
                      reload();
                    });
                  }}
                >
                  <div className="mt-4 flex flex-col gap-3">
                    <Input
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      label={t('adminI18nView.codeEGSv')}
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      autoFocus
                    />
                    <Input
                      autoComplete="off"
                      label={t('adminI18nView.nameEGSwedish')}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <Dialog.Actions>
                    <Dialog.Close>{t('adminI18nView.cancel')}</Dialog.Close>
                    <Button
                      type="submit"
                      disabled={busy || !code.trim() || !name.trim()}
                    >
                      {busy ? 'Adding…' : 'Add language'}
                    </Button>
                  </Dialog.Actions>
                </form>
              </Dialog.Root>

              <Dialog.Root isOpen={importOpen} onClose={closeImport}>
                <Dialog.Title>
                  Import CSV
                  {importLanguage ? ` — ${importLanguage.name}` : ''}
                </Dialog.Title>
                <div className="mt-4">
                  <FilePicker
                    accept=".csv,text/csv"
                    disabled={busy}
                    labels={{
                      title: busy ? 'Importing…' : 'Translation CSV',
                      description:
                        'Choose a CSV translated from the English base.',
                      browse: busy ? 'Importing…' : 'Choose CSV',
                    }}
                    onFiles={(files) => {
                      const file = files[0];
                      if (file) {
                        runImport(file);
                      }
                    }}
                  />
                </div>
                <Dialog.Actions>
                  <Dialog.Close>{t('adminI18nView.cancel')}</Dialog.Close>
                </Dialog.Actions>
              </Dialog.Root>
            </ViewShell>
          </div>
        </AdminPageLayout>
      </div>
    </AdminGate>
  );
}
