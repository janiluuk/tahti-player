const freeSubscriptions = new Map<string, boolean>();

export const getMockFreeSubscriptionsEnabled = (username: string): boolean =>
  freeSubscriptions.get(username) ?? true;

export const setMockFreeSubscriptionsEnabled = (
  username: string,
  enabled: boolean,
): void => {
  freeSubscriptions.set(username, enabled);
};
