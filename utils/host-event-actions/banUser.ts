// utils/event-actions/banUser.ts
export const banUser = async (
  eventId: string,
  hostId: string,
  userId: string,
  alsoUnfriend: boolean = false,
  alsoBlock: boolean = false
) => {
  try {
    const res = await fetch(`/api/events/${eventId}/ban-user`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hostId,
        userId,
        alsoUnfriend,
        alsoBlock,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "Failed to ban user");
    }

    const data = await res.json();
    return { success: true, data };
  } catch (err: unknown) {
    console.error("Error banning user:", err);
    return { success: false, error: (err as Error).message };
  }
};
