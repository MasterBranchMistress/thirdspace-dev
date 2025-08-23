import type { Notification } from "@/components/notification-page/notificationPage";
import { Dispatch, SetStateAction } from "react";

export async function acceptFriendRequest(
  recieverId: string | undefined,
  senderId: string | undefined,
  setNotifications: Dispatch<SetStateAction<Notification[]>>
) {
  const res = await fetch(`/api/users/${recieverId}/friend-request/accept`, {
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
    console.error("Failed to accept request", await res.json());
  }
}
