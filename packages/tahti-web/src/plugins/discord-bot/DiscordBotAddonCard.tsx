import { BotIcon, RotateCwIcon, SettingsIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

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
      setSettings(data);
      setClientId(data.clientId);
      setInstalled(DISCORD_BOT_ADDON_ID, data.tokenConfigured);
    });
    return () => {
      cancelled = true;
    };
  }, [isBoard, setInstalled]);

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
      toast.success('Discord bot restarting');
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
      toast.success('Discord bot settings saved');
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
            onInstall={() => setOpen(true)}
            labels={{
              install: 'Configure',
              installed: 'Configured',
            }}
          />
        </div>
        {settings?.tokenConfigured ? (
          <Badge variant="pill" color="green">
            Configured
          </Badge>
        ) : (
          <Badge variant="pill" color="secondary">
            Not configured
          </Badge>
        )}
        {settings?.tokenConfigured ? (
          <Tooltip content="Restart" side="top">
            <Button
              size="icon-sm"
              variant="secondary"
              disabled={restarting}
              onClick={() => setConfirmRestart(true)}
              aria-label="Restart Tahti Radio Discord bot"
            >
              <RotateCwIcon size={15} aria-hidden />
            </Button>
          </Tooltip>
        ) : null}
        <Tooltip content="Configure" side="top">
          <Button
            size="icon-sm"
            variant="secondary"
            onClick={() => setOpen(true)}
            aria-label="Configure Tahti Radio Discord bot"
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
          Board-only. Values are stored by Tahti and pushed to the Discord bot.
          The token is never shown again after save.
        </Dialog.Description>
        <div className="mt-4 flex flex-col gap-4">
          <Input
            label="Application / Client ID"
            description="From Discord Developer Portal → General Information."
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            inputMode="numeric"
            error={clientId.trim() ? (clientIdError ?? undefined) : undefined}
            data-testid="discord-bot-client-id"
          />
          <Input
            type="password"
            variant="password"
            label="Bot token"
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
          <Dialog.Close>Cancel</Dialog.Close>
          <Button size="sm" disabled={!canSave} onClick={onSave}>
            {busy ? 'Saving…' : 'Save'}
          </Button>
        </Dialog.Actions>
      </Dialog.Root>
      <ConfirmDialog
        isOpen={confirmRestart}
        title="Restart the Discord bot?"
        description="The bot drops out of Discord for a few seconds and reconnects. Listeners on Tahti Radio aren't affected."
        confirmLabel="Restart"
        onCancel={() => setConfirmRestart(false)}
        onConfirm={onRestart}
      />
    </div>
  );
}
