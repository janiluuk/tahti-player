/** Archive item content types — mirrors the backend's ChannelSoundItem.contentType
 * enum. Single source of truth for the label shown wherever content type is
 * picked, filtered, or displayed (Discover, admin Files, track/archive
 * editors, radio submission and rotation panels), so a new backend value
 * only needs one line here instead of a hunt across every picker.
 *
 * LIVE and EMBED are backend/system-assigned — nothing in this app ever
 * sets an item's contentType to either, so they're excluded from the
 * editor's picker (`SELECTABLE_CONTENT_TYPES`) and only ever shown as a
 * read-only label or filter chip. */
export type ContentTypeId =
  | 'TRACK'
  | 'DJ_SET'
  | 'PODCAST'
  | 'REMIX'
  | 'SHOW'
  | 'EPISODE'
  | 'CLIP'
  | 'LIVE'
  | 'EMBED';

export type ContentTypeOption = {
  id: ContentTypeId;
  label: string;
  selectable: boolean;
};

export const CONTENT_TYPES: ContentTypeOption[] = [
  { id: 'LIVE', label: 'Live broadcast', selectable: false },
  { id: 'TRACK', label: 'Track', selectable: true },
  { id: 'DJ_SET', label: 'DJ Set', selectable: true },
  { id: 'PODCAST', label: 'Podcast', selectable: true },
  { id: 'REMIX', label: 'Remix', selectable: true },
  { id: 'SHOW', label: 'Radio show', selectable: true },
  { id: 'EPISODE', label: 'Episode', selectable: true },
  { id: 'CLIP', label: 'Clip', selectable: true },
  { id: 'EMBED', label: 'Embed', selectable: false },
];

/** Options for a content-type editor picker (upload/edit forms) — excludes
 * the backend/system-only values. */
export const SELECTABLE_CONTENT_TYPES: ContentTypeOption[] =
  CONTENT_TYPES.filter((t) => t.selectable);

/** Backend values retired by the content-taxonomy migration, mapped to the
 * current id so older content (created before the rename) keeps a
 * recognizable label instead of falling back to the raw legacy string. */
const LEGACY_CONTENT_TYPE_ALIASES: Record<string, ContentTypeId> = {
  RADIO_SHOW: 'SHOW',
};

export function contentTypeLabel(
  contentType: string | null | undefined,
): string {
  if (!contentType) {
    return 'Unknown';
  }
  const upper = contentType.toUpperCase();
  const resolved = LEGACY_CONTENT_TYPE_ALIASES[upper] ?? upper;
  const match = CONTENT_TYPES.find((t) => t.id === resolved);
  return match?.label ?? contentType;
}
