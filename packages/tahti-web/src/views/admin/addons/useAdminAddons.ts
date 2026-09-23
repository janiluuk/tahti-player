import { useEffect, useState } from 'react';

import {
  approveAdminAddon,
  createAdminAddonInstall,
  deleteAdminAddonInstall,
  disableAdminAddon,
  fetchAdminAddonInstalls,
  fetchAdminAddons,
  patchAdminAddonInstall,
  registerAdminAddon,
  rejectAdminAddon,
  setAdminAddonDefaultConfig,
  setAdminAddonEnabledByDefault,
  type AdminAddon,
  type AdminAddonInstall,
  type AdminAddonRegisterInput,
  type AdminAddonScope,
} from '../../../api/admin';
import { EMPTY_DRAFT } from './shared';

export function useAdminAddons() {
  const [addons, setAddons] = useState<AdminAddon[]>([]);
  const [scope, setScope] = useState<AdminAddonScope | 'ALL'>('ALL');
  const [needsReviewOnly, setNeedsReviewOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [draft, setDraft] = useState<AdminAddonRegisterInput>(EMPTY_DRAFT);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AdminAddon | null>(null);
  const [manageTarget, setManageTarget] = useState<AdminAddon | null>(null);

  const [surface, setSurface] = useState('homepage');
  const [installs, setInstalls] = useState<AdminAddonInstall[]>([]);
  const [installsLoading, setInstallsLoading] = useState(true);
  const [installsError, setInstallsError] = useState<string | null>(null);
  const [installsPending, setInstallsPending] = useState(false);
  const [installPickerOpen, setInstallPickerOpen] = useState(false);
  const [installPickerError, setInstallPickerError] = useState<string | null>(
    null,
  );
  const [removeInstallTarget, setRemoveInstallTarget] =
    useState<AdminAddonInstall | null>(null);

  const reload = () => {
    setLoading(true);
    void fetchAdminAddons().then((result) => {
      setAddons(result.data);
      setLoading(false);
    });
  };

  const reloadInstalls = (targetSurface: string) => {
    setInstallsLoading(true);
    setInstallsError(null);
    void fetchAdminAddonInstalls(targetSurface).then((result) => {
      setInstalls(result.data);
      setInstallsLoading(false);
    });
  };

  useEffect(() => {
    reload();
  }, []);

  useEffect(() => {
    reloadInstalls(surface);
  }, [surface]);

  const openRegister = () => {
    setDraft(EMPTY_DRAFT);
    setError(null);
    setRegisterOpen(true);
  };

  const applyUpdate = (result: {
    ok: boolean;
    data?: AdminAddon;
    error?: string;
  }) => {
    setPending(false);
    if (!result.ok || !result.data) {
      setError(result.error ?? 'Update failed');
      return;
    }
    const updated = result.data;
    setAddons((current) =>
      current.map((addon) => (addon.id === updated.id ? updated : addon)),
    );
    setManageTarget((current) =>
      current?.id === updated.id ? updated : current,
    );
  };

  const register = () => {
    setPending(true);
    setError(null);
    void registerAdminAddon(draft).then((result) => {
      setPending(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setAddons((current) => [result.data, ...current]);
      setRegisterOpen(false);
    });
  };

  const approve = (addon: AdminAddon) => {
    setPending(true);
    setError(null);
    void approveAdminAddon(addon.id).then(applyUpdate);
  };

  const reject = (addon: AdminAddon, moderationNote: string) => {
    setPending(true);
    setError(null);
    void rejectAdminAddon(addon.id, moderationNote).then((result) => {
      applyUpdate(result);
      if (result.ok) {
        setRejectTarget(null);
      }
    });
  };

  const disable = (addon: AdminAddon) => {
    setPending(true);
    setError(null);
    void disableAdminAddon(addon.id).then((result) => {
      applyUpdate(result);
      if (result.ok) {
        setManageTarget(null);
      }
    });
  };

  const installCandidates = addons.filter(
    (addon) =>
      addon.scope === 'ADMIN' &&
      addon.status === 'APPROVED' &&
      !installs.some((install) => install.widget.id === addon.id),
  );

  const installWidget = (widgetId: string) => {
    setInstallsPending(true);
    setInstallPickerError(null);
    void createAdminAddonInstall(widgetId, surface).then((result) => {
      setInstallsPending(false);
      if (!result.ok) {
        setInstallPickerError(result.error);
        return;
      }
      setInstalls((current) => [...current, result.data]);
      setInstallPickerOpen(false);
    });
  };

  const toggleInstallEnabled = (
    install: AdminAddonInstall,
    enabled: boolean,
  ) => {
    setInstallsPending(true);
    setInstallsError(null);
    void patchAdminAddonInstall(install.id, surface, { enabled }).then(
      (result) => {
        setInstallsPending(false);
        if (!result.ok) {
          setInstallsError(result.error);
          return;
        }
        setInstalls((current) =>
          current.map((item) => (item.id === install.id ? result.data : item)),
        );
      },
    );
  };

  const moveInstall = (
    install: AdminAddonInstall,
    direction: 'up' | 'down',
  ) => {
    const ordered = [...installs].sort((a, b) => a.position - b.position);
    const index = ordered.findIndex((item) => item.id === install.id);
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    const neighbor = ordered[swapIndex];
    if (!neighbor) {
      return;
    }
    setInstallsPending(true);
    setInstallsError(null);
    void Promise.all([
      patchAdminAddonInstall(install.id, surface, {
        position: neighbor.position,
      }),
      patchAdminAddonInstall(neighbor.id, surface, {
        position: install.position,
      }),
    ]).then(([a, b]) => {
      setInstallsPending(false);
      if (!a.ok || !b.ok) {
        reloadInstalls(surface);
        setInstallsError(
          (!a.ok ? a.error : null) ??
            (!b.ok ? b.error : null) ??
            'Reorder failed',
        );
        return;
      }
      setInstalls((current) =>
        current.map((item) => {
          if (item.id === a.data.id) {
            return a.data;
          }
          if (item.id === b.data.id) {
            return b.data;
          }
          return item;
        }),
      );
    });
  };

  const removeInstall = (install: AdminAddonInstall) => {
    setInstallsPending(true);
    setInstallsError(null);
    void deleteAdminAddonInstall(install.id, surface).then((result) => {
      setInstallsPending(false);
      setRemoveInstallTarget(null);
      if (!result.ok) {
        setInstallsError(result.error);
        return;
      }
      setInstalls((current) =>
        current.filter((item) => item.id !== install.id),
      );
    });
  };

  const pendingCount = addons.filter(
    (addon) => addon.status === 'PENDING',
  ).length;

  const visibleAddons = addons
    .filter((addon) => scope === 'ALL' || addon.scope === scope)
    .filter((addon) => !needsReviewOnly || addon.status === 'PENDING');

  const setEnabledByDefault = (addon: AdminAddon, value: boolean) => {
    setPending(true);
    setError(null);
    void setAdminAddonEnabledByDefault(addon.id, value).then(applyUpdate);
  };

  const setDefaultConfig = (addon: AdminAddon, json: string) => {
    setPending(true);
    setError(null);
    void setAdminAddonDefaultConfig(
      addon.id,
      json ? (JSON.parse(json) as Record<string, unknown>) : null,
    ).then(applyUpdate);
  };

  const openInstallPicker = () => {
    setInstallPickerError(null);
    setInstallPickerOpen(true);
  };

  return {
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
  };
}
