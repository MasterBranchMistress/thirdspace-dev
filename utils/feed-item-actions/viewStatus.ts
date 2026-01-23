import { SessionUser } from "@/types/user-session";

type Props = {
  loggedInUser?: SessionUser;
  statusId: string;
};

export const viewStatus = async ({ loggedInUser, statusId }: Props) => {
  try {
    const addView = await fetch(
      `/api/users/${loggedInUser?.id}/feed-item-actions/${statusId}/view`,
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
