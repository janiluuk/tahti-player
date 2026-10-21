export const formatDate = (value: string) =>
  new Date(`${value}T12:00:00Z`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

export const todayUtc = () => new Date().toISOString().slice(0, 10);
