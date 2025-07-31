import { USER_RANKING } from "@/lib/constants";

export function getUserRanking(
  karma: number = 50,
  attended: number = 0
): "bronze" | "silver" | "gold" | "platinum" {
  if (karma >= 90 && attended >= 20)
    return USER_RANKING._PLATINUM as "platinum";
  if (karma >= 80 && attended >= 10) return USER_RANKING._GOLD as "gold";
  if (karma >= 60 && attended >= 5) return USER_RANKING._SILVER as "silver";
  return USER_RANKING._BRONZE as "bronze";
}
