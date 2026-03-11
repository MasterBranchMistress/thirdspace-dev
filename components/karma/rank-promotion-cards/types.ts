import { UserRanking } from "@/lib/constants";
import { FeedTarget, FeedUserActor } from "@/types/user-feed";

export type PromotionRankProps = {
  actor: FeedUserActor;
  target?: FeedTarget;
  timestamp: Date | string;
};
