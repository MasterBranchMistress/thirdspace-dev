import { EventDoc } from "@/lib/models/Event";
import { StatusSparkDoc } from "@/lib/models/User";
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

export const unsparkEvent = async ({ loggedInUser, eventId }: Props) => {
  try {
    const addSpark = await fetch(
      `/api/users/${loggedInUser?.id}/feed-item-actions/event-items/${eventId}/remove-spark`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const deleteSparkRes = await addSpark.json();
    if (!addSpark.ok) return deleteSparkRes.error || "unable to add spark";
    return deleteSparkRes;
  } catch (err) {
    console.log(err as Error);
  }
};

export const getEventSparks = async (
  eventIds: string[],
  loggedInUser?: SessionUser,
) => {
  const res = await fetch(
    `/api/users/${loggedInUser?.id}/metadata/interests/sparked-events`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventIds }),
    },
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? "Failed to fetch sparks");

  return data.sparkedEventIds as string[];
};
