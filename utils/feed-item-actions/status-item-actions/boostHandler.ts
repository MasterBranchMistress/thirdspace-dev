import { SessionUser } from "@/types/user-session";

export const boostStatus = async (statusId: string) => {
  //   const feedItemId = statusId.split(":")[0];
  const r = await fetch(`/api/status/${statusId}/boost`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  const res = await r.json();

  if (!res.ok) {
    throw new Error(res.error ?? "unable to boost status");
  }

  return res;
};

export const getBoostedPromos = async (
  statusIds: string[],
  loggedInUser?: SessionUser,
) => {
  const res = await fetch(
    `/api/users/${loggedInUser?.id}/metadata/interests/boosted-promotions`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statusIds }),
    },
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? "Failed to fetch boosts");

  // Expect API returns { sparkedStatusIds: string[] }
  return data.boostedPromotionIds as string[];
};
