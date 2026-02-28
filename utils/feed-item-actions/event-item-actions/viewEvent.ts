import { SessionUser } from "@/types/user-session";

type Props = {
  loggedInUser?: SessionUser;
  eventId: string;
};

export const viewEvent = async ({ loggedInUser, eventId }: Props) => {
  try {
    const addView = await fetch(
      `/api/users/${loggedInUser?.id}/feed-item-actions/event-items/${eventId}/view`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const addViewRes = await addView.json();
    if (!addView.ok) return addViewRes.error || "unable to count view";
    return addViewRes;
  } catch (err) {
    console.log("Unable to register user", err);
    console.log(err as Error);
  }
};
