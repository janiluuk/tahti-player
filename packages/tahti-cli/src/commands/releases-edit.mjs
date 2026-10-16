import { apiSendJson, CliError } from '../api-client.mjs';
import {
  fetchRelease,
  formatReleaseDetails,
  formatTracklist,
} from './releases-show.mjs';

export const RELEASE_STATES = ['draft', 'published', 'archived'];

export const SMART_LINK_SERVICES = [
  'spotify',
  'apple',
  'tidal',
  'bandcamp',
  'soundcloud',
  'youtube',
  'deezer',
  'amazon',
  'mixcloud',
];

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseDate(value) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!DATE_PATTERN.test(value) || Number.isNaN(date.getTime())) {
    throw new CliError(`Invalid --date "${value}". Expected YYYY-MM-DD.`);
  }
  return value;
}

function parseOnOff(flag, value) {
  if (value !== 'on' && value !== 'off') {
    throw new CliError(`Invalid ${flag} "${value}". Expected on or off.`);
  }
  return value === 'on';
}

export function parseLinks(values) {
  const links = {};
  for (const value of values) {
    const separator = value.indexOf('=');
    const service = (
      separator === -1 ? value : value.slice(0, separator)
    ).toLowerCase();
    if (separator === -1 || !SMART_LINK_SERVICES.includes(service)) {
      throw new CliError(
        `Invalid --link "${value}". Expected <service>=<url> with a service from: ${SMART_LINK_SERVICES.join(', ')}.`,
      );
    }
    const url = value.slice(separator + 1).trim();
    if (url && !/^https?:\/\/\S+$/i.test(url)) {
      throw new CliError(
        `Invalid --link "${value}": the URL must start with http:// or https://.`,
      );
    }
    links[service] = url;
  }
  return links;
}

export function buildReleasePatch(options) {
  if (options.pin && options.unpin) {
    throw new CliError('Give --pin or --unpin, not both.');
  }
  const patch = {};
  if (options.state !== undefined) {
    const state = options.state.toLowerCase();
    if (!RELEASE_STATES.includes(state)) {
      throw new CliError(
        `Invalid --state "${options.state}". Expected one of: ${RELEASE_STATES.join(', ')}.`,
      );
    }
    patch.state = state.toUpperCase();
  }
  if (options.description !== undefined) {
    patch.description = options.description;
  }
  if (options.date !== undefined) {
    patch.releaseDate = parseDate(options.date);
  }
  if (options.pin) {
    patch.pinned = true;
  }
  if (options.unpin) {
    patch.pinned = false;
  }
  if (options.footer !== undefined) {
    patch.showPoweredByFooter = parseOnOff('--footer', options.footer);
  }
  const links = options.link?.length ? parseLinks(options.link) : null;
  if (Object.keys(patch).length === 0 && !links) {
    throw new CliError(
      'Nothing to change.\nRun `tahti releases edit --help` for the fields you can set.',
    );
  }
  return { patch, links };
}

/** The API replaces every smart link at once, so the new links are merged
 * onto the ones the release already has; an empty URL removes a service. */
export function mergeLinks(current, links) {
  const merged = { ...(current ?? {}) };
  for (const [service, url] of Object.entries(links)) {
    if (url) {
      merged[service] = url;
    } else {
      delete merged[service];
    }
  }
  return merged;
}

export async function runReleasesEdit(config, id, options = {}) {
  if (!id) {
    throw new CliError(
      'Missing release id.\nRun `tahti releases edit --help` for usage.',
    );
  }
  const { patch, links } = buildReleasePatch(options);
  if (links) {
    const current = await fetchRelease(config, id);
    patch.smartLinkTargets = mergeLinks(current.smartLinkTargets, links);
  }
  const release = await apiSendJson(
    'PATCH',
    `/api/me/releases/${encodeURIComponent(id)}`,
    patch,
    config,
  );
  if (options.json) {
    return JSON.stringify(release, null, 2);
  }
  const details = formatReleaseDetails(release);
  const tracks = release.tracks ?? [];
  if (tracks.length === 0) {
    return `${details}\n\nNo tracks yet.`;
  }
  return `${details}\n\n${formatTracklist(tracks)}`;
}
