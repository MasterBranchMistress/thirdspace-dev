import { EventDoc } from "@/lib/models/Event";
import { UserDoc } from "@/lib/models/User";

export function isUserBannedFromEvent(
  event: EventDoc,
  viewer: UserDoc | null
): boolean {
  if (!viewer) return false;

  return (
    event.banned?.some(
      (bannedId) => bannedId.toString() === viewer._id?.toString()
    ) ?? false
  );
}
