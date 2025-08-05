import { ObjectId } from "mongodb";
import { FeedEventActor, FeedTarget, FeedItemType } from "@/types/user-feed";

export interface EventFeedDoc {
  _id?: ObjectId;
  userId: ObjectId;
  type: Extract<
    FeedItemType,
    "event_is_popular" | "event_coming_up" | "event_is_nearby"
  >;
  actor: FeedEventActor;
  target?: FeedTarget;
  timestamp: Date;
}
