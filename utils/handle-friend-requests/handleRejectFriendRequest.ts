import { Dispatch, SetStateAction } from "react";
import { Notification } from "@/components/notification-page/notificationPage";

export async function rejectFriendRequest(
  recieverId: string | undefined,
  senderId: string | undefined,
  setNotifications: Dispatch<SetStateAction<Notification[]>>
) {
  const res = await fetch(`/api/users/${recieverId}/friend-request/reject`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fromId: senderId,
    }),
  });

  if (res.ok) {
    setNotifications((prev) =>
      prev.filter((n) => String(n.actorId) !== String(senderId))
    );
  } else {
    console.error("Failed to reject request", await res.json());
  }
}
