import { ObjectId } from "mongodb";
import { EventDoc } from "@/lib/models/Event";
import { UserDoc } from "@/lib/models/User";
import { getGravatarUrl } from "../gravatar";
import { FeedItemUser, FeedActor } from "@/types/user-feed";

export async function generateUserFeed(
  user: UserDoc,
  friends: UserDoc[],
  events: EventDoc[]
): Promise<FeedItemUser[]> {
  const feedItems: FeedItemUser[] = [];

  for (const friend of friends) {
    const actor: FeedActor = {
      id: friend._id!.toString(),
      firstName: friend.firstName,
      lastName: friend.lastName,
      username: friend.username,
      avatar: friend.avatar || getGravatarUrl(friend.email),
    };

    // ✅ Profile Updated
    if (friend.updatedAt) {
      feedItems.push({
        id: new ObjectId(),
        type: "profile_updated",
        actor,
        target: {
          userId: friend._id!,
          snippet: friend.bio,
          location: friend.location,
          schedule: friend.availibility,
          profilePicture: friend.avatar,
          badge: friend.qualityBadge,
          interests: friend.interests,
        },
        timestamp: friend.updatedAt.toISOString(),
      });
    }

    // ✅ Friend Accepted
    if (friend.friends?.some((id) => id.equals(user._id))) {
      feedItems.push({
        id: new ObjectId(),
        type: "friend_accepted",
        actor,
        target: {
          userId: user._id!,
        },
        timestamp: friend.updatedAt?.toISOString() ?? new Date().toISOString(),
      });
    }

    // ✅ Joined/Hosted Events
    for (const event of events) {
      if (!event.attendees?.some((id) => id.equals(friend._id))) continue;

      feedItems.push({
        id: new ObjectId(),
        type: event.host.equals(friend._id) ? "hosted_event" : "joined_event",
        actor,
        target: {
          eventId: event._id!,
          title: event.title,
        },
        timestamp: event.updatedAt?.toISOString() ?? event.date.toISOString(),
      });
    }
  }

  return feedItems;
}
