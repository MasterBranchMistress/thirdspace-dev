import { getDurationInMinutes } from "../metadata/get-event-duration/eventDuration";

const MINUTE = 1000 * 60;

export function getEventRange(date: Date, startTime: string, endTime: string) {
  const start = new Date(date).getTime();
  const duration = getDurationInMinutes(startTime, endTime) || 30;
  const end = start + duration * MINUTE;

  return { start, end };
}
