import { Availability } from "@/lib/models/User";
import { ObjectId } from "mongodb";

export type FeedItemType =
  | "joined_event"
  | "hosted_event"
  | "created_event"
  | "friend_accepted"
  | "profile_updated"
  | "event_is_popular"
  | "event_is_nearby"
  | "event_coming_up";

export interface FeedActor {
  id: string;
  name: string;
  username: string;
  avatar: string;
}

export interface FeedEventActor {
  eventId: string;
  eventName: string;
  location: {
    lat: number;
    lng: number;
  };
  totalAttendance: number;
  startingDate: Date;
}

export interface FeedTarget {
  eventId?: ObjectId;
  userId?: ObjectId;
  title?: string;
  snippet?: string;
  location?: string;
  schedule?: Availability[];
  profilePicture?: string;
  badge?: "bronze" | "silver" | "gold" | "platinum";
  interests?: string[];
}

export interface FeedItemUser {
  id: ObjectId;
  type: FeedItemType;
  actor: FeedActor;
  target?: FeedTarget;
  timestamp: string;
}

export interface FeedItemEvent {
  id: string;
  type: FeedItemType;
  actor: FeedEventActor;
  target?: FeedTarget;
  timestamp: string;
}

export type FeedItem = FeedItemUser | FeedItemEvent;
