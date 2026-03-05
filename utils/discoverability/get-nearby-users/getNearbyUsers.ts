import { UserDoc } from "@/lib/models/User";
import { SessionUser } from "@/types/user-session";

export const getNearbyUsers = async (loggedInUser: UserDoc) => {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/users/${loggedInUser._id?.toString()}/get-nearby-users`,
      { method: "POST" },
    );

    if (!res.ok) {
      throw new Error("Failed to fetch nearby users");
    }

    const data = await res.json();
    return data.users ?? [];
  } catch (err) {
    console.error("Unable to fetch nearby events:", err);
    return [];
  }
};
