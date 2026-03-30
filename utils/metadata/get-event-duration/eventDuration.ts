export function getDurationInMinutes(
  start: string,
  end: string,
): number | null {
  if (!start || !end) return null;

  const parse = (time: string) => {
    const parts = time.split(":");
    if (parts.length !== 2) return null;

    const [hours, minutes] = parts.map(Number);

    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes) ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      return null;
    }

    return hours * 60 + minutes;
  };

  const startMinutes = parse(start);
  const endMinutes = parse(end);

  if (startMinutes === null || endMinutes === null) return null;

  const duration = endMinutes - startMinutes;

  if (duration < 15) return null;

  return duration;
}
