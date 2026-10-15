const pad = (value: number, length = 2) => String(value).padStart(length, '0');

/** `HH:mm:ss.SSS` in local time. */
export const formatClockTime = (date: Date) =>
  `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`;

/** `yyyy-MM-dd HH:mm:ss.SSS` in local time. */
export const formatDateTime = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${formatClockTime(date)}`;

export const formatTimeMillis = (totalMillis: number | undefined) => {
  if (totalMillis === undefined) {
    return '';
  }
  const totalSeconds = Math.floor(totalMillis / 1000);
  return formatTimeSeconds(totalSeconds);
};

export const formatTimeSeconds = (totalSeconds: number | undefined) => {
  if (totalSeconds === undefined) {
    return '';
  }

  const sign = totalSeconds < 0 ? '-' : '';
  const secs = Math.abs(Math.trunc(totalSeconds));
  const hours = Math.floor(secs / 3600);
  const minutes = Math.floor((secs % 3600) / 60);
  const seconds = String(secs % 60).padStart(2, '0');
  return hours > 0
    ? `${sign}${hours}:${String(minutes).padStart(2, '0')}:${seconds}`
    : `${sign}${minutes}:${seconds}`;
};
