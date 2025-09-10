import { UserDoc } from "@/lib/models/User";
import { SessionUser } from "@/types/user-session";

type Users = {
  userWereFollowing: UserDoc;
};

export async function handleFollowUser({ userWereFollowing }: Users) {
  try {
    const res = await fetch(
      `/api/users/${String(userWereFollowing._id)}/follow-handler`,
      {
        method: "PATCH",
      }
    );
    if (!res.ok) {
      throw new Error("Unable to follow User");
    }
  } catch (err) {
    throw new Error(err as string);
  }
}
