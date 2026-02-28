import { SessionUser } from "@/types/user-session";

type Props = {
  loggedInUser?: SessionUser;
  statusId?: string;
};

export const sparkStatus = async ({ loggedInUser, statusId }: Props) => {
  try {
    const addSpark = await fetch(
      `/api/users/${loggedInUser?.id}/feed-item-actions/status-items/${statusId}/send-spark`,
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
