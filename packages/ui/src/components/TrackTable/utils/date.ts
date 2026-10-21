const ISO_DATE = /^\d{4}(-\d{2}(-\d{2})?)?([T ].*)?$/;

const releaseDateFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

/** Formats a track's ISO release date for the table's release-date column
 * -- short, no time component. Returns '' when missing or unparsable so the
 * cell just renders blank rather than "Invalid DateTime". */
export const formatReleaseDate = (dateIso: string | undefined): string => {
  if (!dateIso) {
    return '';
  }
  // Parsed as UTC so the displayed date doesn't shift a day depending on
  // the viewer's timezone -- release dates arrive as bare calendar dates.
  const time = ISO_DATE.test(dateIso) ? Date.parse(dateIso) : Number.NaN;
  if (Number.isNaN(time)) {
    return '';
  }
  return releaseDateFormat.format(new Date(time));
};
