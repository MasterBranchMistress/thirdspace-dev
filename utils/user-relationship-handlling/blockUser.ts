import { UserDoc } from "@/lib/models/User";
import { SessionUser } from "@/types/user-session";

type Users = {
  loggedInUser: SessionUser;
  userToBlock: UserDoc;
};

export async function blockUser({ loggedInUser, userToBlock }: Users) {
  try {
    const res = await fetch(`/api/users/${loggedInUser.id}/block-user`, {
      method: "PATCH",
      body: JSON.stringify({
        blockUserId: String(userToBlock._id),
      }),
    });

    if (res.ok) {
      throw new Error("Could not block user");
    }
  } catch (err) {
    return err;
  }
}
