import { SessionUser } from "@/types/user-session";

type Props = {
  user: SessionUser;
};

export const getUserFeed = async ({ user }: Props) => {
  const res = await fetch(`api/users/${user.id}/user-feed`);
  const data = await res.json();
  return data;
};
