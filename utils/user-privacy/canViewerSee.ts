import { PrivacyConfig, UserDoc } from "@/lib/models/User";

export function canViewerSee(
  user: UserDoc,
  viewer: UserDoc | null,
  field: keyof PrivacyConfig
): boolean {
  const level = user.privacy[field];

  //SCRUM-83: implement in events and users APIs
  if (user.privacy.visibility === "off") return false;
  if (viewer && user._id?.toString() === viewer._id?.toString()) return true;

  switch (level) {
    case "public":
      return true;
    case "followers":
      return !!viewer && (user.followers?.includes(viewer._id!) ?? false);
    case "friends":
      return !!viewer && (user.friends?.includes(viewer._id!) ?? false);
    case "off":
    default:
      return false;
  }
}
