import { libraryDomain } from './library';
import { playbackDomain } from './playback';
import { queueDomain } from './queue';
import { radioDomain } from './radio';
import { tahtiDomain } from './tahti';
import {
  McpUserError,
  type DomainDef,
  type MethodDef,
  type ParamDef,
  type TypeShapes,
} from './types';

export const MCP_DOMAINS: Record<string, DomainDef> = {
  Playback: playbackDomain,
  Queue: queueDomain,
  Library: libraryDomain,
  Radio: radioDomain,
  Tahti: tahtiDomain,
};

export const MCP_TYPES: TypeShapes = {
  PlaybackState: {
    status: '"idle" | "loading" | "playing" | "paused" | "error"',
    error: 'string | null',
    current: '{ id, title, artist } | null — the loaded queue item',
    positionSec: 'number',
    durationSec: 'number (0 for live streams and radio)',
    isLive: 'boolean — live streams and radio cannot seek or shuffle',
    volume: 'number from 0 to 1',
    muted: 'boolean',
    shuffle: 'boolean',
    repeatMode: '"off" | "all" | "one"',
  },
  QueueItem: {
    index: 'number — position, 0 is first',
    id: 'string — pass to Queue.playItem or Queue.remove',
    title: 'string',
    artist: 'string',
    current: 'boolean — true for the loaded item',
  },
  PlayResult: { queued: 'number — items started or added to the queue' },
  LibraryTrack: {
    id: 'string — pass to Library.play',
    title: 'string',
    artist: 'string',
    album: 'string',
    durationSec: 'number | null',
    available: 'boolean — false when the file is missing',
  },
  LibraryPage: {
    total: 'number — all matches',
    tracks: 'LibraryTrack[] — this page',
  },
  LibraryTotals: {
    trackCount: 'number',
    durationSec: 'number | null',
    sizeBytes: 'number',
  },
  LocalPlaylist: {
    id: 'string',
    name: 'string',
    trackCount: 'number',
    durationSec: 'number | null',
  },
  RadioStation: {
    id: 'string — pass to Radio.play',
    name: 'string',
    language: 'string — built-in stations only',
    playable: 'boolean — built-in stations only; false when there is no stream',
    country: 'string | null — directory results only',
    tags: 'string[] — directory results only',
    bitrateKbps: 'number | null — directory results only',
  },
  TahtiSearchResult: {
    tracks: '{ id, title, artist, durationSec }[]',
    artists: '{ username, name }[] — pass username to Tahti.playArtist',
    collections: '{ slug, name, owner }[]',
  },
};

function domainList() {
  return Object.entries(MCP_DOMAINS).map(([name, domain]) => ({
    domain: name,
    description: domain.description,
  }));
}

function findDomain(name: unknown): [string, DomainDef] {
  const domain =
    typeof name === 'string' && Object.hasOwn(MCP_DOMAINS, name)
      ? MCP_DOMAINS[name]
      : undefined;
  if (!domain) {
    throw new McpUserError(
      `Unknown domain "${String(name)}". Domains: ${Object.keys(MCP_DOMAINS).join(', ')}.`,
    );
  }
  return [name as string, domain];
}

function findMethod(qualified: unknown): [string, MethodDef] {
  const text = typeof qualified === 'string' ? qualified : '';
  const dot = text.indexOf('.');
  if (dot < 1) {
    throw new McpUserError(
      `"${String(qualified)}" is not in Domain.method form, e.g. "Playback.toggle".`,
    );
  }
  const [domainName, domain] = findDomain(text.slice(0, dot));
  const name = text.slice(dot + 1);
  const method = Object.hasOwn(domain.methods, name)
    ? domain.methods[name]
    : undefined;
  if (!method) {
    throw new McpUserError(
      `${domainName} has no method "${name}". Methods: ${Object.keys(domain.methods).join(', ')}.`,
    );
  }
  return [`${domainName}.${name}`, method];
}

function describeParam(param: ParamDef) {
  return {
    name: param.name,
    type: param.oneOf
      ? param.oneOf.map((value) => `"${value}"`).join(' | ')
      : param.type,
    optional: Boolean(param.optional),
    description: param.description,
  };
}

function checkParam(
  method: string,
  param: ParamDef,
  value: unknown,
): string | null {
  if (value === undefined || value === null) {
    return param.optional
      ? null
      : `${method} needs "${param.name}" (${param.type}).`;
  }
  const ok =
    param.type === 'string[]'
      ? Array.isArray(value) && value.every((item) => typeof item === 'string')
      : param.type === 'number'
        ? typeof value === 'number' && Number.isFinite(value)
        : typeof value === param.type;
  if (!ok) {
    return `${method}: "${param.name}" must be a ${param.type}.`;
  }
  if (param.oneOf && !param.oneOf.includes(value as string)) {
    return `${method}: "${param.name}" must be one of ${param.oneOf.join(', ')}.`;
  }
  return null;
}

const META: Record<string, (params: Record<string, unknown>) => unknown> = {
  listMethods: ({ domain }) => {
    if (domain === undefined || domain === null || domain === '') {
      return { domains: domainList() };
    }
    const [name, def] = findDomain(domain);
    return {
      domain: name,
      description: def.description,
      methods: Object.entries(def.methods).map(([method, meta]) => ({
        method,
        description: meta.description,
      })),
    };
  },
  methodDetails: ({ method }) => {
    const [name, def] = findMethod(method);
    return {
      method: name,
      description: def.description,
      params: def.params.map(describeParam),
      returns: def.returns,
    };
  },
  describeType: ({ type }) => {
    const name = String(type).replace(/\[\]$/, '');
    const shape = Object.hasOwn(MCP_TYPES, name) ? MCP_TYPES[name] : undefined;
    if (!shape) {
      throw new McpUserError(
        `Unknown type "${String(type)}". Types: ${Object.keys(MCP_TYPES).join(', ')}.`,
      );
    }
    return { type: name, fields: shape };
  },
};

/** Runs one bridge request: `Meta.*` describes the API, anything else calls a method. */
export async function dispatchMcp(
  method: string,
  params: Record<string, unknown> = {},
): Promise<unknown> {
  if (method.startsWith('Meta.')) {
    const name = method.slice('Meta.'.length);
    const meta = Object.hasOwn(META, name) ? META[name] : undefined;
    if (!meta) {
      throw new McpUserError(`Unknown request "${method}".`);
    }
    return meta(params);
  }
  const [name, def] = findMethod(method);
  const problems = def.params
    .map((param) => checkParam(name, param, params[param.name]))
    .filter((problem): problem is string => problem !== null);
  const known = new Set(def.params.map((param) => param.name));
  const unknown = Object.keys(params).filter((key) => !known.has(key));
  if (unknown.length) {
    problems.push(
      `${name} does not take ${unknown.map((key) => `"${key}"`).join(', ')}.`,
    );
  }
  if (problems.length) {
    throw new McpUserError(problems.join(' '));
  }
  return (await def.run(params)) ?? null;
}
