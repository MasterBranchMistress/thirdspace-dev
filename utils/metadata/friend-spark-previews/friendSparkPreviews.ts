import { SessionUser } from "@/types/user-session";

export const getFriendSparkPreviews = async (
  loggedInUser: SessionUser,
  statusIds: string[],
  eventIds: string[],
) => {
  const res = await fetch(
    `/api/users/${loggedInUser.id}/metadata/interests/friend-spark-preview`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statusIds, eventIds, limitPerTarget: 2 }),
    },
  );
  const preview = await res.json();

  return preview;
};
