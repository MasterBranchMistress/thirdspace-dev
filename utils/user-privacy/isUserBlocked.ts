import { UserDoc } from "@/lib/models/User";

export function isUserBlocked(user: UserDoc, viewer: UserDoc | null): boolean {
  if (!viewer) return false;

  return (
    user.blocked?.some(
      (blockedId) => blockedId.toString() === viewer._id?.toString()
    ) ?? false
  );
}
