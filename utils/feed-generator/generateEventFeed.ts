import { EventDoc } from "@/lib/models/Event";
import { UserDoc } from "@/lib/models/User";
import { FeedItemEvent } from "@/types/user-feed";
import { ObjectId } from "mongodb";

export async function generateEventFeed(
  user: UserDoc,
  events: EventDoc[]
): Promise<FeedItemEvent[]> {
  const feed: FeedItemEvent[] = [];

  const now = new Date();

  for (const event of events) {
    const isUpcoming =
      event.date.getTime() - now.getTime() < 1000 * 60 * 60 * 48; // < 48 hours
    const isPopular = (event.attendees?.length || 0) > 15; // or whatever threshold
    // const isNearby = false; // TODO: Add location distance calc here

    const base = {
      id: new ObjectId().toString(),
      actor: {
        eventId: event._id!.toString(),
        eventName: event.title,
        location: {
          name: event.title,
          lat: event.location?.lat ?? 0,
          lng: event.location?.lng ?? 0,
        },
        totalAttendance: event.attendees?.length || 0,
        startingDate: event.date,
      },
      target: {
        eventId: event._id!,
        title: event.title,
      },
    };

    if (isPopular) {
      feed.push({
        ...base,
        type: "event_is_popular",
        timestamp: event.updatedAt?.toISOString() ?? event.date.toISOString(),
      });
    }

    if (isUpcoming) {
      feed.push({
        ...base,
        type: "event_coming_up",
        timestamp: event.date.toISOString(),
      });
    }

    // Example: skip if event has no location
    if (event.location && user.location) {
      // TODO: add location proximity logic
      // if (isNearby(user.location, event.location)) { ... }
    }
  }

  return feed;
}
