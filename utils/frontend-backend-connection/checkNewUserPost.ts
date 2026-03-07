import { UserDoc } from "@/lib/models/User";

export const didNewUserPost = async (loggedInUser: UserDoc) => {
  const res = await fetch(
    `/api/users/${String(loggedInUser._id)}/onboarding/check-status-post`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  const profile = await res.json();

  return profile;
};
