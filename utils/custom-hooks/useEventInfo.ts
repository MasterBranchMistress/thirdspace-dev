import { useMemo } from "react";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import { EventDoc } from "@/lib/models/Event";

type UseEventInfoArgs = {
  event: EventDoc;
};

export default function useEventInfo({ event }: UseEventInfoArgs) {
  const startDate = useMemo(() => {
    return event.date ? new Date(event.date) : null;
  }, [event.date]);

  //   const endDate = useMemo(() => {
  //     return event.endingDate ? new Date(event.endingDate) : null;
  //   }, [event.endingDate]);

  const title = event.title?.trim() ?? "Untitled Event";
  const description = event.description?.trim() ?? "";
  const attachments = event.attachments ?? [];
  const attendeeCount = event.attendees?.length ?? 0;

  const location = event.location ?? null;

  const formattedDate = startDate ? format(startDate, "PPP") : "Date TBD";
  const formattedTime = startDate ? format(startDate, "p") : "Time TBD";

  const dateLabel = startDate
    ? isToday(startDate)
      ? "Today"
      : isTomorrow(startDate)
        ? "Tomorrow"
        : format(startDate, "PPP")
    : "Date TBD";

  const pastEvent = startDate ? isPast(startDate) : false;

  return {
    event,
    title,
    description,
    attachments,
    attendeeCount,
    location,
    startDate,
    formattedDate,
    formattedTime,
    dateLabel,
    pastEvent,
  };
}
