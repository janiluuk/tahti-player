import type { AdvancedTheme } from './schema';

type ThemeVarsValue = Record<string, string>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === 'string')
  );
}

function checkVars(
  value: unknown,
  field: string,
  problems: string[],
): ThemeVarsValue | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!isRecord(value)) {
    problems.push(`${field} must be an object of CSS variable values`);
    return undefined;
  }
  const entries = Object.entries(value);
  if (entries.some(([, v]) => typeof v !== 'string')) {
    problems.push(`${field} values must be strings`);
  }
  if (entries.some(([k]) => !k || k.startsWith('--'))) {
    problems.push(`${field} keys must be CSS var names without leading --`);
  }
  return value as ThemeVarsValue;
}

/**
 * Checks an advanced theme without loading zod, so applying a theme at start
 * stays out of the schema code. Accepts and rejects the same input as
 * `AdvancedThemeSchema` and, like it, drops unknown keys.
 */
export function parseAdvancedTheme(input: unknown): AdvancedTheme {
  if (!isRecord(input)) {
    throw new Error('Invalid theme: expected an object');
  }
  const problems: string[] = [];
  const { version, name, author, description, tags, palette, vars, dark } =
    input;
  if (version !== 1) {
    problems.push('version must be 1');
  }
  if (typeof name !== 'string' || name.length === 0) {
    problems.push('name is required');
  }
  if (
    author !== undefined &&
    (typeof author !== 'string' || author.length === 0)
  ) {
    problems.push('author must be a non-empty string');
  }
  if (description !== undefined && typeof description !== 'string') {
    problems.push('description must be a string');
  }
  if (tags !== undefined && !isStringArray(tags)) {
    problems.push('tags must be a list of strings');
  }
  if (
    palette !== undefined &&
    !(isStringArray(palette) && palette.length === 4)
  ) {
    problems.push('palette must be four colours');
  }
  const checkedVars = checkVars(vars, 'vars', problems);
  const checkedDark = checkVars(dark, 'dark', problems);
  if (problems.length > 0) {
    throw new Error(`Invalid theme: ${problems.join('; ')}`);
  }
  const theme: AdvancedTheme = { version: 1, name: name as string };
  if (author !== undefined) {
    theme.author = author as string;
  }
  if (description !== undefined) {
    theme.description = description as string;
  }
  if (tags !== undefined) {
    theme.tags = [...(tags as string[])];
  }
  if (palette !== undefined) {
    theme.palette = [...(palette as string[])] as AdvancedTheme['palette'];
  }
  if (checkedVars !== undefined) {
    theme.vars = { ...checkedVars };
  }
  if (checkedDark !== undefined) {
    theme.dark = { ...checkedDark };
  }
  return theme;
}
