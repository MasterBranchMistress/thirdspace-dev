import { USER_RANKING, UserRanking } from "@/lib/constants";

export function getUserRanking(
  karma: number = 0,
  attended: number = 0,
): UserRanking {
  if (karma >= 600 && attended >= 50) return USER_RANKING.LUMINARY;
  if (karma >= 300 && attended >= 25) return USER_RANKING.PIONEER;
  if (karma >= 150 && attended >= 15) return USER_RANKING.CONNECTOR;
  if (karma >= 75 && attended >= 8) return USER_RANKING.NAVIGATOR;
  if (karma >= 25 && attended >= 3) return USER_RANKING.EXPLORER;

  return USER_RANKING.DRIFTER;
}
