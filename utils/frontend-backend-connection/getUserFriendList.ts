import { SessionUser } from "@/types/user-session";

export const getUserFriends = async (loggedInUser: SessionUser) => {
  const res = await fetch(`/api/users/${loggedInUser.id}/get-friend-list`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const users = await res.json();

  console.log(users);

  return users;
};
