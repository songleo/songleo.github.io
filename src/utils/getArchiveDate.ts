const formatters = new Map<string, Intl.DateTimeFormat>();

/** Group by the displayed publication date, independent of the build host TZ. */
export function getArchiveDate(date: Date, timeZone: string) {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "numeric",
      timeZone,
    });
    formatters.set(timeZone, formatter);
  }
  const parts = formatter.formatToParts(date);
  return {
    year: Number(parts.find(part => part.type === "year")!.value),
    month: Number(parts.find(part => part.type === "month")!.value),
  };
}
