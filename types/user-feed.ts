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
  timestamp?: string;
  eventSnippet?: string;
  eventAttachments?: Attachment[];
  distanceFromEvent?: number;
  eventLocation?: string;
}

export type AttachmentType = "image" | "video" | undefined;

export interface Attachment {
  url: string;
  type?: AttachmentType; // optional for legacy; we can infer if missing
  poster?: string; // optional: video thumbnail if you ever add it
}

/**
 * Actor representing an event in the feed.
 */
export interface FeedEventActor {
  hostFirstName?: string;
  hostUser?: string;
  host?: string;
  eventId?: ObjectId;
  avatar?: string;
  eventName: string;
  location?: {
    name?: string;
    lat?: number;
    lng?: number;
  };
  totalAttendance?: number;
  startingDate?: string;
}

/**
 * Target data for the feed item (user, event, or other content).
 */
export interface FeedTarget {
  eventId?: string | ObjectId;
  userId?: string | ObjectId;
  title?: string;
  type?: FeedItemType;
  snippet?: string;
  description?: string;
  host?: string;
  hostName?: string;
  location?: {
    address?: string;
    name?: string;
    lat?: number;
    lng?: number;
  };
  distanceMiles?: number;

  // ✅ Backward compatible: strings (legacy) OR objects (new)
  attachments?: (string | Attachment)[];
  avatar?: string;
  photoCredit?: {
    name: string;
    username: string;
    profileUrl: string;
    link: string;
  };
  schedule?: Availability[];
  username?: string;
  profilePicture?: string;
  badge?: "bronze" | "silver" | "gold" | "platinum";
  tags?: string[];
  status?: string;
  notes?: string;
  currency?: string;
  cost?: number;
  budget?: {
    estimatedCost?: number;
    notes?: string;
    currency?: string;
  };
  startingDate?: string;
  totalAttendance?: number;

  // (Optional/legacy) If you’re standardizing on attachments, consider deprecating these:
  mediaUrls?: string[];
  thumbnailUrl?: string;
  mediaType?: "image" | "video" | null;

  views?: number;
  commentsCount?: number;
  comments?: string[];
  likes?: number;
  orbiters?: number;
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
  avatar?: string;
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
  timestamp: Date; // ISO string
}

/**
 * Union of all feed item shapes.
 */
export type FeedItem = FeedItemUser | FeedItemEvent;
