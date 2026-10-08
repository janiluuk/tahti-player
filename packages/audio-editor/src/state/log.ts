export function logInfo(..._args: [string, string]): void {
  void _args;
}
export function logWarn(..._args: [string, string]): void {
  void _args;
}
export function logError(_scope: string, msg: string): void {
  void _scope;
  console.error(`[audio-editor] ${msg}`);
}
