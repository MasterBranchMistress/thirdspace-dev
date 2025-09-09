import { Dispatch, SetStateAction } from "react";
import { Notification } from "@/components/notification-page/notificationPage";
import { SessionUser } from "@/types/user-session";
import { UserDoc } from "@/lib/models/User";

export async function rejectFriendRequest(
  sender: SessionUser,
  recipient: UserDoc,
  setNotifications: Dispatch<SetStateAction<Notification[]>>
) {
  const res = await fetch(
    `/api/users/${String(recipient._id)}/friend-request/reject`,
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
    console.error("Failed to reject request", await res.json());
  }
}
