import { ObjectId } from "mongodb";
import { FeedUserActor, FeedTarget, FeedItemType } from "@/types/user-feed";

export interface UserFeedDoc {
  _id?: ObjectId;
  userId: ObjectId;
  type: Extract<
    FeedItemType,
    | "friend_accepted"
    | "joined_event"
    | "hosted_event"
    | "status_posted"
    | "created_event"
    | "profile_bio_updated"
    | "profile_avatar_updated"
    | "profile_location_updated"
    | "profile_username_updated"
    | "profile_tags_updated"
    | "profile_status_updated"
  >;
  actor: FeedUserActor;
  target?: FeedTarget;
  timestamp: string;
}
