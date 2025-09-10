import type { Notification } from "@/components/notification-page/notificationPage";
import { UserDoc } from "@/lib/models/User";
import { SessionUser } from "@/types/user-session";
import { Dispatch, SetStateAction } from "react";

export async function acceptFriendRequest(
  recipient: UserDoc,
  sender: SessionUser,
  setNotifications: Dispatch<SetStateAction<Notification[]>>
) {
  const res = await fetch(
    `/api/users/${String(recipient._id)}/friend-request/accept`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromId: sender.id,
      }),
    }
  );

  if (res.ok) {
    setNotifications((prev) =>
      prev.filter((n) => String(n.actorId) !== String(sender.id))
    );
  } else {
    console.error("Failed to accept request", await res.json());
  }
}
