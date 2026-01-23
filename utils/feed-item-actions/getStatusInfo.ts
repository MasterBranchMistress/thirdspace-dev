import { SessionUser } from "@/types/user-session";

export type StatusData = {
  _id: string;
  sourceId: string;
  userId: string;
  content: string;
  createdAt: string;
  attachments: any[];
  sparks: number;
  views: number;
};

export const getStatusInfo = async (
  loggedInUser?: SessionUser,
  statusId?: string,
) => {
  const r = await fetch(
    `/api/users/${loggedInUser?.id}/feed-item-actions/${statusId}/get-status-info`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    },
  );

  const res = await r.json();

  if (!r.ok) {
    throw new Error(res.error ?? "unable to get status info");
  }

  return res.statusInfo as StatusData;
};
