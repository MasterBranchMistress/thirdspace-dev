import { SessionUser } from "@/types/user-session";

export const getUser = async (loggedInUser: SessionUser) => {
  const res = await fetch(`/api/users/${loggedInUser.id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const profile = await res.json();

  return profile;
};
