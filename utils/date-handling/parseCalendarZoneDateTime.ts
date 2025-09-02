import { ZonedDateTime } from "@internationalized/date";

export function parseZonedDate(zdt: ZonedDateTime | null) {
  if (!zdt) return { jsDate: "", time: "" };

  const jsDate = new Date(zdt.toAbsoluteString());

  // ISO string for date (no time)
  const isoDate = jsDate.toISOString(); // YYYY-MM-DD

  // HH:mm string
  const time = jsDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false, // force 24h, can toggle
  });

  console.log(isoDate, time);

  return { isoDate, time };
}
