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
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        unblockUserId: String(userToUnblock._id),
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.message || "Could not unblock user");
    }

    return data;
  } catch (err: any) {
    throw new Error(err?.message || "Something went wrong");
  }
}
