import { UserDoc } from "@/lib/models/User";
import { SessionUser } from "@/types/user-session";

export const markComplete = async (user: UserDoc) => {
  const res = await fetch(
    `/api/users/${String(user._id)}/onboarding/complete-onboard`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
  );

  if (!res.ok) {
    throw new Error("Failed to update onboarding progress");
  }

  return await res.json();
};
