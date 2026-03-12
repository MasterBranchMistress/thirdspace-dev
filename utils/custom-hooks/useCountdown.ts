export function getTimeUntilEvent(date: Date | string) {
  const now = Date.now();
  const eventTime = new Date(date).getTime();
  const diff = eventTime - now;

  if (diff <= 0) return "Happening now";

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (hours >= 1) {
    return `Happening in ${hours} hour${hours > 1 ? "s" : ""}`;
  }

  return `Happening in ${minutes} minute${minutes > 1 ? "s" : ""}`;
}
