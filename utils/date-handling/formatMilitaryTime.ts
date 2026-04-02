export function formatMilitaryTime(time: string) {
  if (!time || typeof time !== "string") {
    return "Unknown time";
  }

  const parts = time.split(":");

  const [hoursStr, minutesStr] = parts;

  const hoursParsed = parseInt(hoursStr, 10);

  if (Number.isNaN(hoursParsed)) {
    return "Unknown time";
  }

  let hours = hoursParsed;
  const minutes = minutesStr || "00";

  const period = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  const formatted = `${hours}:${minutes} ${period}`;

  return formatted;
}
