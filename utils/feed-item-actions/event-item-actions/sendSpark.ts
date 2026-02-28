import { SessionUser } from "@/types/user-session";

type Props = {
  loggedInUser?: SessionUser;
  eventId?: string;
};

export const sparkEvent = async ({ loggedInUser, eventId }: Props) => {
  try {
    const addSpark = await fetch(
      `/api/users/${loggedInUser?.id}/feed-item-actions/event-items/${eventId}/send-spark`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const addSparkRes = await addSpark.json();
    if (!addSpark.ok) return addSparkRes.error || "unable to add spark";
    return addSparkRes;
  } catch (err) {
    console.log(err as Error);
  }
};
