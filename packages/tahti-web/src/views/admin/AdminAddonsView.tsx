import { PlusIcon } from 'lucide-react';

import { Button, FilterChips, Tooltip, ViewShell } from '@tahti-player/ui';

import type { AdminAddonScope } from '../../api/admin';
import { AdminGate } from '../../components/AdminGate';
import { AdminPageLayout } from '../../components/AdminNav';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { PageLoading } from '../../components/PageStates';
import { AddonCard } from './addons/AddonCard';
import { InstallPickerDialog } from './addons/InstallPickerDialog';
import { InstallsPanel } from './addons/InstallsPanel';
import { ManageDialog } from './addons/ManageDialog';
import { RegisterDialog } from './addons/RegisterDialog';
import { RejectDialog } from './addons/RejectDialog';
import { SCOPES } from './addons/shared';
import { useAdminAddons } from './addons/useAdminAddons';

export function AdminAddonsView() {
  const {
    scope,
    setScope,
    needsReviewOnly,
    setNeedsReviewOnly,
    loading,
    registerOpen,
    setRegisterOpen,
    draft,
    setDraft,
    pending,
    error,
    rejectTarget,
    setRejectTarget,
    manageTarget,
    setManageTarget,
    surface,
    setSurface,
    installs,
    installsLoading,
    installsError,
    installsPending,
    installPickerOpen,
    setInstallPickerOpen,
    installPickerError,
    removeInstallTarget,
    setRemoveInstallTarget,
    openRegister,
    register,
    approve,
    reject,
    disable,
    setEnabledByDefault,
    setDefaultConfig,
    installCandidates,
    installWidget,
    toggleInstallEnabled,
    moveInstall,
    removeInstall,
    openInstallPicker,
    pendingCount,
    visibleAddons,
  } = useAdminAddons();

  return (
    <AdminGate>
      <div className="admin-page-layout px-1 py-2">
        <AdminPageLayout current="/admin/addons">
          <div className="flex max-w-5xl flex-col gap-6">
            <ViewShell title="Add-ons" classes={{ root: 'px-0 pt-0' }}>
              <p className="text-foreground-secondary text-sm">
                Covers the sandboxed widget-bundle store behind two of the 13
                Settings → Add-ons categories: Discovery (Listen page) and
                Channel (artist page). The other 11 are fixed code registries or
                private per-user connections with nothing to moderate here — see
                docs/todo/admin-plugin-management-panel.md for the full category
                audit.
              </p>
              <Tooltip content="Register a new add-on" side="top">
                <Button
                  type="button"
                  size="icon-sm"
                  aria-label="Register a new add-on"
                  onClick={openRegister}
                >
                  <PlusIcon size={18} aria-hidden />
                </Button>
              </Tooltip>

              <FilterChips
                aria-label="Add-on types"
                className="border-border border-b pb-3"
                items={[
                  { id: 'ALL', label: 'All add-ons' },
                  ...SCOPES.map((item) => ({ id: item.id, label: item.label })),
                ]}
                selected={scope}
                onChange={(id) => setScope(id as AdminAddonScope | 'ALL')}
              />

              <FilterChips
                aria-label="Add-on review status"
                className="border-border border-b pb-3"
                items={[
                  { id: 'ALL', label: 'All statuses' },
                  {
                    id: 'PENDING',
                    label:
                      pendingCount > 0
                        ? `Needs review (${pendingCount})`
                        : 'Needs review',
                  },
                ]}
                selected={needsReviewOnly ? 'PENDING' : 'ALL'}
                onChange={(id) => setNeedsReviewOnly(id === 'PENDING')}
              />

              {error && !registerOpen && !rejectTarget && !manageTarget ? (
                <p className="text-accent-red text-sm" role="alert">
                  {error}
                </p>
              ) : null}
              {loading ? (
                <PageLoading label="Loading add-on catalog…" />
              ) : visibleAddons.length === 0 ? (
                <p className="text-foreground-secondary text-sm">
                  {needsReviewOnly
                    ? 'No add-ons need review right now.'
                    : 'No add-ons registered for this type yet.'}
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {visibleAddons.map((addon) => (
                    <AddonCard
                      key={addon.id}
                      addon={addon}
                      pending={pending}
                      onApprove={approve}
                      onReject={setRejectTarget}
                      onManage={setManageTarget}
                    />
                  ))}
                </div>
              )}

              <RegisterDialog
                isOpen={registerOpen}
                draft={draft}
                pending={pending}
                error={error}
                onChange={setDraft}
                onClose={() => setRegisterOpen(false)}
                onSave={register}
              />

              <RejectDialog
                addon={rejectTarget}
                pending={pending}
                onCancel={() => setRejectTarget(null)}
                onConfirm={(note) => reject(rejectTarget!, note)}
              />

              <ManageDialog
                addon={manageTarget}
                pending={pending}
                error={error}
                onClose={() => setManageTarget(null)}
                onSetEnabledByDefault={setEnabledByDefault}
                onSetDefaultConfig={setDefaultConfig}
                onDisable={disable}
              />

              <InstallsPanel
                surface={surface}
                onSurfaceChange={setSurface}
                installs={installs}
                loading={installsLoading}
                pending={installsPending}
                error={installsError}
                onOpenPicker={openInstallPicker}
                onToggleEnabled={toggleInstallEnabled}
                onMove={moveInstall}
                onRemove={setRemoveInstallTarget}
              />

              <InstallPickerDialog
                isOpen={installPickerOpen}
                candidates={installCandidates}
                pending={installsPending}
                error={installPickerError}
                onCancel={() => setInstallPickerOpen(false)}
                onInstall={installWidget}
              />

              <ConfirmDialog
                isOpen={removeInstallTarget !== null}
                title={
                  removeInstallTarget
                    ? `Remove "${removeInstallTarget.widget.name}" from ${surface}?`
                    : 'Remove install?'
                }
                description="Stops it rendering on this surface immediately. It stays available to reinstall."
                confirmLabel="Remove"
                onCancel={() => setRemoveInstallTarget(null)}
                onConfirm={() =>
                  removeInstallTarget && removeInstall(removeInstallTarget)
                }
              />
            </ViewShell>
          </div>
        </AdminPageLayout>
      </div>
    </AdminGate>
  );
}
