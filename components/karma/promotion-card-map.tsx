"use client";

import { FeedTarget, FeedUserActor } from "@/types/user-feed";

import DrifterPromotion from "./rank-promotion-cards/DrifterPromotion";
import ExplorerPromotion from "./rank-promotion-cards/ExplorerPromotion";
import NavigatorPromotion from "./rank-promotion-cards/NavigatorPromotion";
import ConnectorPromotion from "./rank-promotion-cards/ConnectorPromotion";
import PioneerPromotion from "./rank-promotion-cards/PioneerPromotion";
import LuminaryPromotion from "./rank-promotion-cards/LuminaryPromotion";
import { PromotionRankProps } from "./rank-promotion-cards/types";
import { UserRanking } from "@/lib/constants";

type PromotionFeedItemProps = {
  actor: FeedUserActor;
  timestamp: Date | string;
  newRank?: UserRanking;
  target?: FeedTarget;
};

const promotionComponentMap: Record<
  UserRanking,
  React.ComponentType<PromotionRankProps>
> = {
  drifter: DrifterPromotion,
  explorer: ExplorerPromotion,
  navigator: NavigatorPromotion,
  connector: ConnectorPromotion,
  pioneer: PioneerPromotion,
  luminary: LuminaryPromotion,
};

export default function PromotionFeedItem({
  actor,
  timestamp,
  target,
  newRank,
}: PromotionFeedItemProps) {
  if (!newRank) return null;

  const RankComponent = newRank ? promotionComponentMap[newRank] : null;

  if (!RankComponent) return null;

  return <RankComponent actor={actor} target={target} timestamp={timestamp} />;
}
