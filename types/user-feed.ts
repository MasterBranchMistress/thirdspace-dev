import { Availability } from "@/lib/models/User";
import { ObjectId } from "mongodb";

/**
 * All possible feed item types supported.
 * Keep this in sync with backend generators.
 */
export type FeedItemType =
  | "joined_event"
  | "hosted_event"
  | "created_event"
  | "friend_accepted"
  | "profile_updated"
  | "profile_bio_updated"
  | "profile_avatar_updated"
  | "profile_location_updated"
  | "profile_username_updated"
  | "profile_tags_updated"
  | "profile_status_updated"
  | "status_posted"
  | "event_is_popular"
  | "event_is_nearby"
  | "event_coming_up";

/**
 * Actor representing a user in the feed.
 * `id` can come from Mongo so we support both ObjectId and string.
 */
export interface FeedUserActor {
  id?: string | ObjectId;
  firstName?: string;
  lastName?: string;
  username?: string;
  avatar?: string;
  timestamp?: string; // rarely needed, mostly used for actor-specific updates
}

/**
 * Actor representing an event in the feed.
 */
export interface FeedEventActor {
  eventId: string | ObjectId;
  eventName: string;
  location?: {
    name: string;
    lat: number;
    lng: number;
  };
  totalAttendance?: number;
  startingDate?: string | Date; // store as string in API responses
}

/**
 * Target data for the feed item (user, event, or other content).
 */
export interface FeedTarget {
  eventId?: string | ObjectId;
  userId?: string | ObjectId;
  title?: string;
  snippet?: string;
  location?: string;
  attachments?: string[];
  schedule?: Availability[];
  username?: string;
  profilePicture?: string;
  badge?: "bronze" | "silver" | "gold" | "platinum";
  tags?: string[];
  status?: string;
}

/**
 * Feed item when the actor is a user.
 */
export interface FeedItemUser {
  id: string; // feed item id, not the actor id
  type: FeedItemType;
  actor: FeedUserActor;
  status?: string;
  target?: FeedTarget;
  timestamp: string; // ISO string
}

/**
 * Feed item when the actor is an event.
 */
export interface FeedItemEvent {
  id: string;
  type: FeedItemType;
  actor: FeedEventActor;
  target?: FeedTarget;
  timestamp: string; // ISO string
}

/**
 * Union of all feed item shapes.
 */
export type FeedItem = FeedItemUser | FeedItemEvent;
