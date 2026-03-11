import { ObjectId } from "mongodb";
import { FeedUserActor, FeedTarget, FeedItemType } from "@/types/user-feed";
import { EventDoc } from "./Event";
import { UserDoc } from "./User";

export interface UserFeedDoc {
  _id?: ObjectId;
  userId?: ObjectId;
  sourceId?: string;
  type: Extract<
    FeedItemType,
    | "friend_accepted"
    | "joined_event"
    | "hosted_event"
    | "status_posted"
    | "created_event"
    | "profile_avatar_updated"
    | "profile_status_updated"
    | "profile_bio_updated"
    | "joined_platform"
    | "user_promoted"
  >;
  actor: FeedUserActor;
  target?: FeedTarget;
  timestamp: string;
}
