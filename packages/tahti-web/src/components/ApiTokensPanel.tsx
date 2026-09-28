import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  Button,
  CopyButton,
  Input,
  SectionShell,
  Toggle,
} from '@tahti-player/ui';

import {
  createApiToken,
  fetchApiTokens,
  revokeApiToken,
  type ApiToken,
} from '../api/api-tokens';
import { ConfirmDialog } from './ConfirmDialog';
import { PageLoading } from './PageStates';

function formatDate(value: string | null): string {
  if (!value) {
    return 'Never';
  }
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function ApiTokensPanel() {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [canWrite, setCanWrite] = useState(false);
  const [saving, setSaving] = useState(false);
  const [revealedToken, setRevealedToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingRevoke, setPendingRevoke] = useState<ApiToken | null>(null);

  useEffect(() => {
    void fetchApiTokens().then((result) => {
      setTokens(result.data);
      setLoading(false);
    });
  }, []);

  const createToken = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }
    setSaving(true);
    setError(null);
    void createApiToken(
      trimmedName,
      canWrite ? ['read', 'write'] : ['read'],
    ).then((result) => {
      setSaving(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const { token, ...view } = result.data;
      setTokens((current) => [view, ...current]);
      setRevealedToken(token);
      setAdding(false);
      setName('');
      setCanWrite(false);
      toast.success('API token created.');
    });
  };

  const revokeToken = (token: ApiToken) => {
    void revokeApiToken(token.id).then((result) => {
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setTokens((current) => current.filter((item) => item.id !== token.id));
      toast.success('API token revoked.');
    });
  };

  return (
    <SectionShell title="API tokens">
      <p className="text-foreground-secondary mb-4 text-sm">
        Personal tokens for scripts and third-party integrations. Each token is
        shown only once when created.
      </p>
      {loading ? (
        <PageLoading label="Loading API tokens…" />
      ) : (
        <div className="flex flex-col gap-4">
          {revealedToken ? (
            <div className="border-accent-yellow/40 bg-accent-yellow/10 rounded-lg border p-3">
              <p className="text-sm font-medium">
                New token — copy it now; it will not be shown again.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Input
                  aria-label="New API token"
                  value={revealedToken}
                  readOnly
                  onFocus={(event) => event.currentTarget.select()}
                />
                <CopyButton
                  text={revealedToken}
                  size="sm"
                  variant="secondary"
                  toastMessage="Token copied."
                  aria-label="Copy API token"
                />
                <Button
                  size="sm"
                  variant="text"
                  onClick={() => setRevealedToken(null)}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          ) : null}

          {tokens.length === 0 ? (
            <p className="text-foreground-secondary text-sm">
              No API tokens yet. Create one for scripted access to the Tahti
              API.
            </p>
          ) : (
            <ul className="divide-border divide-y">
              {tokens.map((token) => (
                <li
                  key={token.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {token.name}{' '}
                      <span className="text-foreground-secondary font-mono text-xs">
                        {token.tokenPrefix}…
                      </span>
                    </p>
                    <p className="text-foreground-secondary text-xs">
                      {token.scopes.includes('write')
                        ? 'Read / write'
                        : 'Read-only'}{' '}
                      · last used {formatDate(token.lastUsedAt)} · created{' '}
                      {formatDate(token.createdAt)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPendingRevoke(token)}
                  >
                    Revoke
                  </Button>
                </li>
              ))}
            </ul>
          )}

          {!adding ? (
            <Button
              size="sm"
              className="self-start"
              onClick={() => setAdding(true)}
            >
              New token
            </Button>
          ) : (
            <div className="border-border flex flex-col gap-3 border-t pt-4">
              {error ? (
                <p className="text-accent-red-strong text-sm" role="alert">
                  {error}
                </p>
              ) : null}
              <Input
                label="Name"
                value={name}
                maxLength={64}
                placeholder="e.g. archive importer"
                onChange={(event) => setName(event.target.value)}
              />
              <div className="text-foreground-secondary flex items-center justify-between gap-3 text-sm">
                <span>
                  Allow write access (create, update, and delete). Leave off for
                  read-only access.
                </span>
                <Toggle
                  label="Allow write access"
                  checked={canWrite}
                  onChange={setCanWrite}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  disabled={saving || name.trim().length === 0}
                  onClick={createToken}
                >
                  {saving ? 'Creating…' : 'Create token'}
                </Button>
                <Button
                  size="sm"
                  variant="text"
                  onClick={() => {
                    setAdding(false);
                    setError(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
      <ConfirmDialog
        isOpen={pendingRevoke !== null}
        title={
          pendingRevoke ? `Revoke “${pendingRevoke.name}”?` : 'Revoke token?'
        }
        description="Anything using this token will stop working immediately."
        confirmLabel="Revoke"
        onCancel={() => setPendingRevoke(null)}
        onConfirm={() => {
          const token = pendingRevoke;
          setPendingRevoke(null);
          if (token) {
            revokeToken(token);
          }
        }}
      />
    </SectionShell>
  );
}
