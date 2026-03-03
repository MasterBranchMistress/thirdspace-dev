import { StatusSparkDoc } from "@/lib/models/User";
import { UserStatusDoc } from "@/lib/models/UserStatusDoc";
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

export const unsparkStatus = async ({ loggedInUser, statusId }: Props) => {
  try {
    const addSpark = await fetch(
      `/api/users/${loggedInUser?.id}/feed-item-actions/status-items/${statusId}/remove-spark`,
      {
        method: "DELETE",
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

export const getStatusSparks = async (
  statusIds: string[],
  loggedInUser?: SessionUser,
) => {
  const res = await fetch(
    `/api/users/${loggedInUser?.id}/metadata/interests/sparked-statuses`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statusIds }),
    },
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? "Failed to fetch sparks");

  // Expect API returns { sparkedStatusIds: string[] }
  return data.sparkedStatusIds as string[];
};
