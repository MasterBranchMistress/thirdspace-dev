import { UserDoc } from "@/lib/models/User";
import { SessionUser } from "@/types/user-session";

type Users = {
  loggedInUser: SessionUser;
  userToUnfriend: UserDoc;
};

export async function unfriendUser({ loggedInUser, userToUnfriend }: Users) {
  try {
    const res = await fetch(`/api/users/${loggedInUser.id}/remove-friend`, {
      method: "PATCH",
      body: JSON.stringify({
        friendId: String(userToUnfriend._id),
      }),
    });

    if (!res.ok) {
      throw new Error("Could not unfriend user");
    }
  } catch (err) {
    return err;
  }
}
