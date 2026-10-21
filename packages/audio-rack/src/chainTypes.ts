export interface VstNode {
  plugin_path: string;
  plugin_name: string;
  raw_state?: string;
}

export interface ChainEntry {
  id: string;
  effect: string;
  params: Record<string, number>;
  enabled: boolean;
  vst?: VstNode;
  label?: string;
}

export const EFFECT_LABELS: Record<string, string> = {};

export function newChainEntry(
  effect: string,
  params: Record<string, number>,
): ChainEntry {
  return {
    id: crypto.randomUUID(),
    effect,
    params: { ...params },
    enabled: true,
  };
}
