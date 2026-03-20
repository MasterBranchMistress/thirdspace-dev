import { SessionUser } from "@/types/user-session";

export const getUserFollowers = async (userId: string) => {
  const res = await fetch(`/api/users/${userId}/get-follower-list`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const users = await res.json();

  console.log(users);

  return users;
};
