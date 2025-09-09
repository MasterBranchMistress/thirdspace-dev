import { UserDoc } from "@/lib/models/User";

export function canViewerSee(user: UserDoc, viewer: UserDoc | null): boolean {
  const level = user.visibility;

  //SCRUM-83: implement in events and users APIs
  if (viewer && String(user._id) === String(viewer._id)) return true;
  if (user.visibility === "off" || !viewer) return false;
  try {
    switch (level) {
      case "public":
        return true;
      case "followers":
        return (
          !!viewer &&
          (user.followers?.some(
            (f) => f.toString() === viewer._id!.toString()
          ) ||
            user.friends?.some(
              (f) => f.toString() === viewer._id!.toString()
            ) ||
            false)
        );
      case "friends":
        return (
          !!viewer &&
          (String(user._id) === String(viewer._id) || // self check
            (user.friends?.some(
              (friendId) => friendId.toString() === viewer._id?.toString()
            ) ??
              false))
        );

      case "off":
      default:
        return false;
    }
  } catch (err) {
    return err as any;
  }
}
