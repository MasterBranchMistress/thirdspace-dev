export function getTimeUntilEvent(date: Date | string, disabled?: boolean) {
  const now = Date.now();
  const eventTime = new Date(date).getTime();
  const diff = eventTime - now;

  if (diff <= 0) return "Happening now";
  if (diff <= 0) {
    disabled = true;
  }

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) {
    return `T-Minus: ${minutes} minute${minutes !== 1 ? "s" : ""}`;
  }

  if (hours < 24) {
    return `T-Minus: ${hours} hour${hours !== 1 ? "s" : ""}`;
  }

  if (days === 1) {
    return "Landing tomorrow";
  }

  if (days < 7) {
    return `Landing in ${days} day${days !== 1 ? "s" : ""}`;
  }

  const weeks = Math.floor(days / 7);
  return `In Orbit: ${weeks} week${weeks !== 1 ? "s" : ""}`;
}

export function isPastDate(dateString?: string) {
  if (!dateString) return false;

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return false;

  return date.getTime() < Date.now();
}
