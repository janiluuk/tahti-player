import { ArrowDownIcon, ArrowUpIcon, PlusIcon, Trash2Icon } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Badge,
  Button,
  InlineError,
  Input,
  Toggle,
  Tooltip,
} from '@tahti-player/ui';

import { type AdminAddonInstall } from '../../../api/admin';
import { PageEmpty, PageLoading } from '../../../components/PageStates';

export function InstallsPanel({
  surface,
  onSurfaceChange,
  installs,
  loading,
  pending,
  error,
  onOpenPicker,
  onToggleEnabled,
  onMove,
  onRemove,
}: {
  surface: string;
  onSurfaceChange: (value: string) => void;
  installs: AdminAddonInstall[];
  loading: boolean;
  pending: boolean;
  error: string | null;
  onOpenPicker: () => void;
  onToggleEnabled: (install: AdminAddonInstall, enabled: boolean) => void;
  onMove: (install: AdminAddonInstall, direction: 'up' | 'down') => void;
  onRemove: (install: AdminAddonInstall) => void;
}) {
  const { t } = useTranslation('web');
  return (
    <div className="border-border mt-2 flex flex-col gap-4 border-t pt-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-semibold">
            {t('installsPanel.adminSurfaceInstalls')}
          </h3>
          <p className="text-foreground-secondary text-sm">
            Explicit, ordered installs of Admin-scope add-ons onto a shared
            surface. Separate from "enabled by default" above — an install
            targets one specific surface with its own position and settings
            override. Only <code>homepage</code> has a public renderer today (
            <code>GET /api/v1/addons/homepage</code>).
          </p>
        </div>
        <Button type="button" size="sm" onClick={onOpenPicker}>
          <PlusIcon size={15} aria-hidden className="mr-1.5" />
          {t('installsPanel.installWidget')}
        </Button>
      </div>
      <Input
        label={t('installsPanel.surface')}
        value={surface}
        onChange={(event) => onSurfaceChange(event.target.value)}
        className="max-w-xs"
        description={t('installsPanel.freeformSurfaceIdEG')}
      />
      {error ? <InlineError>{error}</InlineError> : null}
      {loading ? (
        <PageLoading label={t('loading.loadingInstalls')} />
      ) : installs.length === 0 ? (
        <PageEmpty
          title={t('installsPanelLabels.nothingInstalledOnSurfaceYet', {
            surface,
          })}
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {installs.map((install, index) => (
            <li
              key={install.id}
              className="border-border bg-background-secondary/40 flex flex-wrap items-center gap-3 rounded-lg border p-3"
            >
              <div className="min-w-0 flex-1 basis-40">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{install.widget.name}</span>
                  <Badge
                    variant="pill"
                    color={install.enabled ? 'green' : 'orange'}
                  >
                    {install.enabled
                      ? t('installsPanelStates.enabled')
                      : t('installsPanelStates.disabled')}
                  </Badge>
                </div>
                <p className="text-foreground-secondary text-xs">
                  Position {install.position} · {install.widget.slug}
                </p>
              </div>
              <Toggle
                checked={install.enabled}
                disabled={pending}
                label={t('installsPanelLabels.enableNameOnSurface', {
                  name: install.widget.name,
                  surface,
                })}
                onChange={(checked) => onToggleEnabled(install, checked)}
              />
              <Tooltip content={t('installsPanel.moveUp')} side="top">
                <Button
                  type="button"
                  size="icon-sm"
                  variant="text"
                  aria-label={t('installsPanelLabels.moveNameUp', {
                    name: install.widget.name,
                  })}
                  disabled={pending || index === 0}
                  onClick={() => onMove(install, 'up')}
                >
                  <ArrowUpIcon size={16} aria-hidden />
                </Button>
              </Tooltip>
              <Tooltip content={t('installsPanel.moveDown')} side="top">
                <Button
                  type="button"
                  size="icon-sm"
                  variant="text"
                  aria-label={t('installsPanelLabels.moveNameDown', {
                    name: install.widget.name,
                  })}
                  disabled={pending || index === installs.length - 1}
                  onClick={() => onMove(install, 'down')}
                >
                  <ArrowDownIcon size={16} aria-hidden />
                </Button>
              </Tooltip>
              <Tooltip content={t('installsPanel.remove')} side="top">
                <Button
                  type="button"
                  size="icon-sm"
                  variant="text"
                  aria-label={t('installsPanelLabels.removeNameFromSurface', {
                    name: install.widget.name,
                    surface,
                  })}
                  disabled={pending}
                  onClick={() => onRemove(install)}
                >
                  <Trash2Icon
                    className="text-accent-red-strong"
                    size={16}
                    aria-hidden
                  />
                </Button>
              </Tooltip>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
