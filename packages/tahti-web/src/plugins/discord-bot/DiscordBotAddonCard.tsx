import { BotIcon, RotateCwIcon, SettingsIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { i18n, useTranslation } from '@tahti-player/i18n';
import {
  Badge,
  Button,
  Dialog,
  ExternalLink,
  Input,
  PluginStoreItem,
  Tooltip,
} from '@tahti-player/ui';

import {
  fetchDiscordBotSettings,
  restartDiscordBot,
  saveDiscordBotSettings,
  type DiscordBotSettings,
} from '../../api/discord-bot';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { hasAccountRole } from '../../lib/accountRoles';
import { useAuthStore } from '../../stores/authStore';
import { usePluginInstallStore } from '../../stores/pluginInstallStore';
import {
  DISCORD_BOT_ADDON,
  DISCORD_BOT_ADDON_ID,
  validateDiscordBotToken,
  validateDiscordClientId,
} from './index';

export function DiscordBotAddonCard() {
  const { t } = useTranslation('web');
  const user = useAuthStore((s) => s.user);
  const isBoard = hasAccountRole(user, 'BOARD');
  const setInstalled = usePluginInstallStore((s) => s.setInstalled);

  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<DiscordBotSettings | null>(null);
  const [clientId, setClientId] = useState('');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!isBoard) {
      setInstalled(DISCORD_BOT_ADDON_ID, false);
      return;
    }
    let cancelled = false;
    void fetchDiscordBotSettings().then(({ data, meta }) => {
      if (cancelled) {
        return;
      }
      if (meta.source === 'api' && meta.reason?.includes('403')) {
        setForbidden(true);
        setInstalled(DISCORD_BOT_ADDON_ID, false);
        return;
      }
      if (meta.source === 'api' && meta.reason) {
        setLoadError(true);
        return;
      }
      setLoadError(false);
      setSettings(data);
      setClientId(data.clientId);
      setInstalled(DISCORD_BOT_ADDON_ID, data.tokenConfigured);
    });
    return () => {
      cancelled = true;
    };
  }, [isBoard, setInstalled, attempt]);

  if (!isBoard || forbidden) {
    return null;
  }

  const clientIdError = validateDiscordClientId(clientId);
  const tokenError = validateDiscordBotToken(
    token,
    Boolean(settings?.tokenConfigured),
  );
  const canSave = !clientIdError && !tokenError && !busy;

  const onRestart = () => {
    setConfirmRestart(false);
    setRestarting(true);
    void restartDiscordBot().then((result) => {
      setRestarting(false);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(i18n.t('web:toasts.discordBotRestarting'));
    });
  };

  const onSave = () => {
    if (!canSave) {
      return;
    }
    setBusy(true);
    void saveDiscordBotSettings({
      clientId: clientId.trim(),
      ...(token.trim() ? { token: token.trim() } : {}),
    }).then((result) => {
      setBusy(false);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setSettings(result.data);
      setClientId(result.data.clientId);
      setToken('');
      setInstalled(DISCORD_BOT_ADDON_ID, result.data.tokenConfigured);
      toast.success(i18n.t('web:toasts.discordBotSettingsSaved'));
      setOpen(false);
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <PluginStoreItem
            icon={<BotIcon size={22} aria-hidden />}
            name={DISCORD_BOT_ADDON.name}
            author={DISCORD_BOT_ADDON.author}
            description={DISCORD_BOT_ADDON.description}
            isInstalled={Boolean(settings?.tokenConfigured)}
            onInstall={() => (loadError ? undefined : setOpen(true))}
            labels={{
              install: 'Configure',
              installed: 'Configured',
            }}
          />
        </div>
        {loadError ? (
          <>
            <Badge variant="pill" color="red">
              {t('discordBotCard.statusUnavailable')}
            </Badge>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setAttempt((n) => n + 1)}
            >
              {t('discordBotCard.retry')}
            </Button>
          </>
        ) : settings?.tokenConfigured ? (
          <Badge variant="pill" color="green">
            {t('discordBotCard.configured')}
          </Badge>
        ) : (
          <Badge variant="pill" color="secondary">
            {t('discordBotCard.notConfigured')}
          </Badge>
        )}
        {settings?.tokenConfigured ? (
          <Tooltip content={t('discordBotCard.restart')} side="top">
            <Button
              size="icon-sm"
              variant="secondary"
              disabled={restarting}
              onClick={() => setConfirmRestart(true)}
              aria-label={t('discordBotCard.restartTahtiRadioDiscordBot')}
            >
              <RotateCwIcon size={15} aria-hidden />
            </Button>
          </Tooltip>
        ) : null}
        <Tooltip content={t('discordBotCard.configure')} side="top">
          <Button
            size="icon-sm"
            variant="secondary"
            disabled={loadError}
            onClick={() => setOpen(true)}
            aria-label={t('discordBotCard.configureTahtiRadioDiscordBot')}
          >
            <SettingsIcon size={15} aria-hidden />
          </Button>
        </Tooltip>
      </div>
      <Dialog.Root
        isOpen={open}
        onClose={() => setOpen(false)}
        className="max-w-lg"
      >
        <Dialog.Title>Configure {DISCORD_BOT_ADDON.name}</Dialog.Title>
        <Dialog.Description>
          {t('discordBotCard.boardOnlyValuesAreStored')}
        </Dialog.Description>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSave();
          }}
        >
          <div className="mt-4 flex flex-col gap-4">
            <Input
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              label={t('discordBotCard.applicationClientId')}
              description={t(
                'discordBotCard.fromDiscordDeveloperPortalGeneral',
              )}
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              inputMode="numeric"
              error={clientId.trim() ? (clientIdError ?? undefined) : undefined}
              data-testid="discord-bot-client-id"
            />
            <Input
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              type="password"
              variant="password"
              label={t('discordBotCard.botToken')}
              description={
                settings?.tokenConfigured
                  ? `Stored token ${settings.tokenHint ?? ''} — leave blank to keep it.`
                  : 'From Discord Developer Portal → Bot → Reset Token.'
              }
              value={token}
              onChange={(e) => setToken(e.target.value)}
              autoComplete="off"
              error={token ? (tokenError ?? undefined) : undefined}
              data-testid="discord-bot-token"
            />
            <p className="text-foreground-secondary text-xs">
              Privacy policy and terms for the Discord app:{' '}
              <ExternalLink href="https://tahti.live/privacy">
                tahti.live/privacy
              </ExternalLink>
              {' · '}
              <ExternalLink href="https://tahti.live/terms">
                tahti.live/terms
              </ExternalLink>
            </p>
          </div>
          <Dialog.Actions>
            <Dialog.Close>{t('discordBotCard.cancel')}</Dialog.Close>
            <Button size="sm" disabled={!canSave} type="submit">
              {busy
                ? t('discordBotAddonCardStates.saving')
                : t('discordBotAddonCardStates.save')}
            </Button>
          </Dialog.Actions>
        </form>
      </Dialog.Root>
      <ConfirmDialog
        isOpen={confirmRestart}
        title={t('discordBotCard.restartTheDiscordBot')}
        description={t('discordBotCard.theBotDropsOutOf')}
        confirmLabel={t('discordBotCard.restart')}
        onCancel={() => setConfirmRestart(false)}
        onConfirm={onRestart}
      />
    </div>
  );
}
