import { SessionUser } from "@/types/user-session";

export const getBoostPreviews = async (
  loggedInUser: SessionUser,
  promotionIds: string[],
) => {
  const res = await fetch(
    `/api/users/${loggedInUser.id}/metadata/interests/boost-preview`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        promotionIds,
        limitPerTarget: 3,
      }),
    },
  );

  if (!res.ok) {
    throw new Error("Failed to fetch boost previews");
  }

  const preview = await res.json();
  return preview;
};
