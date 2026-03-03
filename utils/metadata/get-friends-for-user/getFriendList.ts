import "server-only";

import { Db, ObjectId } from "mongodb";
import { COLLECTIONS } from "@/lib/constants";
import { UserDoc } from "@/lib/models/User";
import { SessionUser } from "@/types/user-session";

export async function getFriendIdsForUser(
  db: Db,
  loggedInUser: SessionUser,
): Promise<ObjectId[]> {
  const usersCollection = db.collection<UserDoc>(COLLECTIONS._USERS);

  const me = await usersCollection.findOne(
    { _id: new ObjectId(loggedInUser.id) },
    { projection: { friends: 1 } },
  );

  // friends is already ObjectId[] in Mongo driver
  return (me?.friends ?? []) as ObjectId[];
}
