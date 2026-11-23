import { useNavigate, useSearch } from '@tanstack/react-router';
import { ClipboardCheckIcon, LayoutGridIcon, PlusIcon } from 'lucide-react';
import { useEffect } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Button,
  FilterBar,
  FilterChips,
  InlineError,
  Tabs,
  Tooltip,
  ViewShell,
} from '@tahti-player/ui';

import type { AdminAddonScope } from '../../api/admin';
import { AdminGate } from '../../components/AdminGate';
import { AdminPageLayout } from '../../components/AdminNav';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { PageEmpty, PageLoading } from '../../components/PageStates';
import { AddonCard } from './addons/AddonCard';
import { InstallPickerDialog } from './addons/InstallPickerDialog';
import { InstallsPanel } from './addons/InstallsPanel';
import { ManageDialog } from './addons/ManageDialog';
import { PublishDialog } from './addons/PublishDialog';
import { RegisterDialog } from './addons/RegisterDialog';
import { RejectDialog } from './addons/RejectDialog';
import { addonScopes } from './addons/shared';
import { useAdminAddons } from './addons/useAdminAddons';

export function AdminAddonsView() {
  const { t } = useTranslation('web');

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
    publishTarget,
    setPublishTarget,
    openPublish,
    publish,
    editTarget,
    setEditTarget,
    openEdit,
    saveEdit,
    deleteTarget,
    setDeleteTarget,
    removeAddon,
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
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { tab?: string };
  const pageTab = search.tab === 'review' ? 'review' : 'catalogue';

  useEffect(() => {
    setNeedsReviewOnly(pageTab === 'review');
    if (pageTab === 'review') {
      setScope('ALL');
    }
  }, [pageTab, setNeedsReviewOnly, setScope]);

  const addonGrid =
    error &&
    !registerOpen &&
    !rejectTarget &&
    !manageTarget &&
    !publishTarget &&
    !editTarget ? (
      <InlineError>{error}</InlineError>
    ) : null;

  const addonList = loading ? (
    <PageLoading label={t('loading.loadingAddOnCatalog')} />
  ) : visibleAddons.length === 0 ? (
    <PageEmpty
      title={
        needsReviewOnly
          ? t('adminAddonsViewStates.noAddOnsNeedReview')
          : t('adminAddonsViewStates.noAddOnsRegisteredFor')
      }
      action={
        needsReviewOnly ? undefined : (
          <Button size="sm" variant="secondary" onClick={openRegister}>
            <PlusIcon size={16} aria-hidden />
            {t('emptyActions.registerAddon')}
          </Button>
        )
      }
    />
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
          onPublish={openPublish}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
        />
      ))}
    </div>
  );

  return (
    <AdminGate>
      <div className="admin-page-layout px-1 py-2">
        <AdminPageLayout current="/admin/addons">
          <div className="flex max-w-5xl flex-col gap-6">
            <ViewShell
              title={t('adminAddonsView.addOns')}
              subtitle={t('adminPages.addonsDescription')}
              classes={{ root: 'px-0 pt-0', content: 'gap-4' }}
              actions={
                <Tooltip
                  content={t('adminAddonsView.registerANewAddOn')}
                  side="top"
                >
                  <Button
                    type="button"
                    size="icon-sm"
                    aria-label={t('adminAddonsView.registerANewAddOn')}
                    onClick={openRegister}
                  >
                    <PlusIcon size={18} aria-hidden />
                  </Button>
                </Tooltip>
              }
            >
              <p className="text-foreground-secondary text-sm">
                {t('adminAddonsView.intro')}
              </p>

              <Tabs
                selectedIndex={pageTab === 'review' ? 0 : 1}
                onChange={(index) => {
                  void navigate({
                    to: '/admin/addons',
                    search: index === 0 ? { tab: 'review' } : {},
                    replace: true,
                  });
                }}
                listClassName="flex-wrap"
                panelClassName="pt-2"
                items={[
                  {
                    id: 'review',
                    label:
                      pendingCount > 0
                        ? t('adminAddonsView.needsReviewCount', {
                            count: pendingCount,
                          })
                        : t('adminAddonsView.review'),
                    icon: <ClipboardCheckIcon size={14} />,
                    content: (
                      <div className="flex flex-col gap-4">
                        {addonGrid}
                        {addonList}
                      </div>
                    ),
                  },
                  {
                    id: 'catalogue',
                    label: t('adminAddonsView.catalogue'),
                    icon: <LayoutGridIcon size={14} />,
                    content: (
                      <div className="flex flex-col gap-4">
                        <FilterBar className="border-border border-b pb-3">
                          <FilterChips
                            aria-label={t('adminAddonsView.addOnTypes')}
                            items={[
                              {
                                id: 'ALL',
                                label: t('adminAddonsViewMore.allAddOns'),
                              },
                              ...addonScopes(t).map((item) => ({
                                id: item.id,
                                label: item.label,
                              })),
                            ]}
                            selected={scope}
                            onChange={(id) =>
                              setScope(id as AdminAddonScope | 'ALL')
                            }
                          />
                        </FilterBar>
                        {addonGrid}
                        {addonList}
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
                      </div>
                    ),
                  },
                ]}
              />

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

              <RegisterDialog
                editing={editTarget?.name ?? null}
                isOpen={editTarget !== null}
                draft={draft}
                pending={pending}
                error={error}
                onChange={setDraft}
                onClose={() => setEditTarget(null)}
                onSave={saveEdit}
              />

              <ConfirmDialog
                destructive
                isOpen={deleteTarget !== null}
                title={
                  deleteTarget
                    ? t('adminAddons.deleteTitleNamed', {
                        name: deleteTarget.name,
                      })
                    : t('adminAddons.deleteTitle')
                }
                description={t('adminAddons.deleteDescription')}
                confirmLabel={t('actions.delete')}
                onCancel={() => setDeleteTarget(null)}
                onConfirm={() => deleteTarget && removeAddon(deleteTarget)}
              />

              <PublishDialog
                addon={publishTarget}
                pending={pending}
                error={error}
                onCancel={() => setPublishTarget(null)}
                onPublish={publish}
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
                destructive
                isOpen={removeInstallTarget !== null}
                title={
                  removeInstallTarget
                    ? t('adminAddons.removeInstallTitleNamed', {
                        name: removeInstallTarget.widget.name,
                        surface,
                      })
                    : t('adminAddons.removeInstallTitle')
                }
                description={t('adminAddons.removeInstallDescription')}
                confirmLabel={t('actions.remove')}
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
