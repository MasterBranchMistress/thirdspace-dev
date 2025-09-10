import { UserDoc } from "@/lib/models/User";
import { SessionUser } from "@/types/user-session";

export async function sendFriendRequest(
  sender: SessionUser,
  recipient: UserDoc
) {
  try {
    const res = await fetch(
      `/api/users/${String(recipient._id)}/friend-request`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromId: String(sender.id),
        }),
      }
    );
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Friend request failed (${res.status}): ${errText}`);
    }

    return await res.json();
  } catch (err) {
    console.log(`Error: ${err}`);
    return err;
  }
}
