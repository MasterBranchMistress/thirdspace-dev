import { Availability, UserDoc } from "@/lib/models/User";
import { ObjectId } from "mongodb";
import { PreviewUser } from "@/app/api/users/[id]/metadata/interests/friend-spark-preview/route";
import { UserRanking } from "@/lib/constants";

/**
 * All possible feed item types supported.
 * Keep this in sync with backend generators.
 */
export type FeedItemType =
  | "joined_event"
  | "joined_platform"
  | "hosted_event"
  | "_hosted_event_"
  | "profile_updated"
  | "profile_bio_updated"
  | "profile_avatar_updated"
  | "profile_location_updated"
  | "profile_status_updated"
  | "discover_events"
  | "discover_users"
  | "event_is_popular"
  | "event_is_nearby"
  | "event_coming_up";

export type UserStatus = {
  content: string;
  attachments: string[];
  sourceId: string;
};

/**
 * Actor representing a user in the feed.
 * `id` can come from Mongo so we support both ObjectId and string.
 */
export interface FeedUserActor {
  qualityBadge?:
    | "drifter"
    | "explorer"
    | "navigator"
    | "connector"
    | "pioneer"
    | "luminary";
  eventId?: ObjectId;
  eventDate?: string;
  id?: string | ObjectId;
  firstName?: string;
  lastName?: string;
  username?: string;
  eventStatus?: string;
  email?: string;
  avatar?: string;
  timestamp?: string;
  eventSnippet?: string;
  eventAttachments?: Attachment[];
  distanceFromEvent?: number;
  eventLocation?: string;
  friendSparkPreviewUsers?: Array<{
    id: string;
    firstName: string;
    avatar?: string;
  }>;
  sharedTags?: [];
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
  id?: string | ObjectId;
  email?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  hostUser?: string;
  attachments?: (string | Attachment)[];
  host?: string;
  eventId?: ObjectId;
  eventName: string;
  location?: {
    name?: string;
    lat?: number;
    lng?: number;
  };
  avatar?: string;
  totalAttendance?: number;
  startingDate?: string;
  friendSparkPreviewUsers?: Array<{
    id: string;
    firstName: string;
    avatar?: string;
  }>;
  qualityBadge?:
    | "drifter"
    | "explorer"
    | "navigator"
    | "connector"
    | "pioneer"
    | "luminary";
}

/**
 * Target data for the feed item (user, event, or other content).
 */
export interface FeedTarget {
  targetTags?: string[];
  targetVisibility?: string;
  exploredSolarSystem?: boolean;
  exploredSpacestation?: boolean;
  eventId?: string | ObjectId;
  statusId?: string | ObjectId;
  eventStatus?: string;
  userId?: string | ObjectId;
  title?: string;
  type?: FeedItemType;
  snippet?: string;
  description?: string;
  host?: string;
  firstName?: string;
  hostName?: string;
  location?: {
    name?: string;
    lat?: number;
    lng?: number;
    geo?: {
      type: string;
      coordinates: number[];
    };
  };
  distanceMiles?: number;
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
  qualityBadge?:
    | "drifter"
    | "explorer"
    | "navigator"
    | "connector"
    | "pioneer"
    | "luminary";
  tags?: string[];
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
  mediaUrls?: string[];
  thumbnailUrl?: string;
  mediaType?: "image" | "video" | null;

  views?: number;
  commentsCount?: number;
  comments?: string[];
  likes?: number;
  orbiters?: number;
  status?: UserStatus;
  friendSparkPreviewUsers?: Array<{
    id: string;
    firstName: string;
    avatar?: string;
  }>;
}

/**
 * Feed item when the actor is a user.
 */

type FeedItemBase = {
  id: string;
  type: FeedItemType;
  timestamp: string;
  friendSparkPreviewUsers?: PreviewUser[];
};

export interface FeedItemUser extends FeedItemBase {
  actor: FeedUserActor;
  target?: FeedTarget;
}

export interface FeedItemEvent extends FeedItemBase {
  actor: FeedEventActor;
  target?: FeedTarget;
}

/**
 * Union of all feed item shapes.
 */
export type FeedItem = FeedItemUser | FeedItemEvent;
