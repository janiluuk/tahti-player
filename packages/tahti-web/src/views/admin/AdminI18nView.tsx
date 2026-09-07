import { PlusIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  Badge,
  Button,
  Dialog,
  FilePicker,
  Input,
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
import { AdminPageLayout } from '../../components/AdminNav';
import { PageLoading } from '../../components/PageStates';
import { StudioPanel } from '../../components/StudioPanel';

export function AdminI18nView() {
  const [languages, setLanguages] = useState<AdminLanguage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOpen, setNewOpen] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [importTarget, setImportTarget] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const reload = () => {
    setLoading(true);
    void fetchAdminLanguages().then((res) => {
      setLanguages(res.data);
      setLoading(false);
    });
  };

  useEffect(reload, []);

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
            <ViewShell
              title="Languages"
              classes={{ root: 'px-0 pt-0' }}
              actions={
                <Tooltip content="New language" side="top">
                  <Button
                    size="icon-sm"
                    onClick={() => setNewOpen(true)}
                    aria-label="New language"
                  >
                    <PlusIcon size={16} aria-hidden />
                  </Button>
                </Tooltip>
              }
            >
              {msg && (
                <p className="text-foreground-secondary text-sm" role="status">
                  {msg}
                </p>
              )}

              <StudioPanel>
                {loading ? (
                  <PageLoading label="Loading languages…" />
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
                                  Base
                                </Badge>
                              )}
                            </div>
                            <div className="mt-1.5 flex items-center gap-2">
                              <div className="bg-background-secondary h-1.5 w-32 overflow-hidden rounded-full">
                                <div
                                  className="bg-primary h-full"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
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
                              Import CSV
                            </Button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </StudioPanel>

              <Dialog.Root isOpen={newOpen} onClose={closeNew}>
                <Dialog.Title>New language</Dialog.Title>
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
                      label="Code (e.g. sv)"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      autoFocus
                    />
                    <Input
                      label="Name (e.g. Swedish)"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <Dialog.Actions>
                    <Dialog.Close>Cancel</Dialog.Close>
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
                  <Dialog.Close>Cancel</Dialog.Close>
                </Dialog.Actions>
              </Dialog.Root>
            </ViewShell>
          </div>
        </AdminPageLayout>
      </div>
    </AdminGate>
  );
}
