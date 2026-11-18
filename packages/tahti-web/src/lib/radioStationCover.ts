import { i18n } from '@tahti-player/i18n';

import {
  fetchAdminInternetRadioPresets,
  patchAdminInternetRadioPreset,
} from '../api/admin';
import { isForceMock } from '../api/mode';
import type { AuthUser } from '../api/types';
import { uploadUserMediaFile } from '../api/user-media';
import { RADIO_STATIONS } from '../content/radioStations';
import { useListenerWidgetsStore } from '../stores/listenerWidgetsStore';
import { hasAccountRole } from './accountRoles';
import {
  imageUploadTypeError,
  resolveImageUploadContentType,
} from './imageUploadContentType';

export function canEditRadioStationCover(
  user: AuthUser | null | undefined,
): boolean {
  return hasAccountRole(user, 'BOARD');
}

/** Admin preset `iconUrl` must be an absolute URL (Zod `.url()`). */
export function toPersistableMediaUrl(url: string): string {
  const trimmed = url.trim();
  if (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }
  if (typeof window !== 'undefined' && trimmed.startsWith('/')) {
    return new URL(trimmed, window.location.origin).href;
  }
  return trimmed;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () =>
      reject(
        reader.error ?? new Error(i18n.t('web:batch57.couldNotReadImage')),
      );
    reader.readAsDataURL(file);
  });
}

export async function uploadRadioCoverFile(
  file: File,
): Promise<{ ok: true; data: { url: string } } | { ok: false; error: string }> {
  if (!resolveImageUploadContentType(file)) {
    return { ok: false, error: imageUploadTypeError(file) };
  }
  if (isForceMock()) {
    try {
      const url = await fileToDataUrl(file);
      return { ok: true, data: { url } };
    } catch (error) {
      return {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : i18n.t('web:batch57.couldNotReadImage'),
      };
    }
  }
  return uploadUserMediaFile(file);
}

export async function persistRadioStationCover(input: {
  catalogStationId?: string;
  presetId?: string;
  stationName: string;
  logoUrl: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const logoUrl = toPersistableMediaUrl(input.logoUrl);
  const catalogStationId =
    input.catalogStationId ??
    RADIO_STATIONS.find((station) => station.name === input.stationName)?.id;
  let wroteLocal = false;
  if (catalogStationId) {
    useListenerWidgetsStore.getState().updateStation(catalogStationId, {
      logoUrl,
    });
    wroteLocal = true;
  }

  const presets = await fetchAdminInternetRadioPresets();
  const presetId =
    input.presetId ??
    presets.data.find((preset) => preset.name === input.stationName)?.id;
  if (!presetId) {
    return wroteLocal
      ? { ok: true }
      : { ok: false, error: 'Station not found' };
  }

  const result = await patchAdminInternetRadioPreset(presetId, {
    iconUrl: logoUrl,
  });
  if (!result.ok) {
    return result;
  }
  return { ok: true };
}
