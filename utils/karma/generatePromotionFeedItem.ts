import { UserDoc } from "@/lib/models/User";
import { SessionUser } from "@/types/user-session";
import { canViewerSee } from "../user-privacy/canViewerSee";
import { UserRanking } from "@/lib/constants";
import { getUserRanking } from "./getRanking";

export function generatePromotionFeedItem(
  user: UserDoc,
  previousRank: UserRanking,
  newRank: UserRanking,
) {
  return {
    actor: {
      id: String(user._id),
      name: user.firstName,
      username: user.username,
      avatar: user.avatar,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    target: {
      previousRank,
      newRank,
    },
    timestamp: new Date().toISOString(),
  };
}
