import { USER_RANKING, UserRanking } from "@/lib/constants";

export function getUserRanking(karma: number = 0): UserRanking {
  if (karma >= 600) return "luminary";
  if (karma >= 300) return "pioneer";
  if (karma >= 150) return "connector";
  if (karma >= 75) return "navigator";
  if (karma >= 25) return "explorer";

  return "drifter";
}
