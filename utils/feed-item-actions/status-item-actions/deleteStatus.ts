import { SessionUser } from "@/types/user-session";

export const deleteStatus = async (statusId: string) => {
  const r = await fetch(`/api/status/${statusId}/delete-status`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  const res = await r.json();

  if (!r.ok) {
    throw new Error(res.error ?? "unable to delete status");
  }

  return res;
};
