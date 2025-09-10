import { UserDoc } from "@/lib/models/User";
import { SessionUser } from "@/types/user-session";

type Users = {
  loggedInUser: SessionUser;
  userToUnblock: UserDoc;
};

export async function unblockUser({ loggedInUser, userToUnblock }: Users) {
  try {
    const res = await fetch(`/api/users/${loggedInUser.id}/unblock-user`, {
      method: "PATCH",
      body: JSON.stringify({
        unblockUserId: String(userToUnblock._id),
      }),
    });

    if (!res.ok) {
      throw new Error("Could not unblock user");
    }
  } catch (err) {
    return err;
  }
}
