import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { COLLECTIONS, DBS } from "@/lib/constants";
import { UserDoc } from "@/lib/models/User";

export async function PATCH() {
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);
  const usersCollection = db.collection<UserDoc>(COLLECTIONS._USERS);

  try {
    // Find users missing any of these fields or with null values
    const result = await usersCollection.updateMany(
      {
        $or: [
          { avatar: { $exists: false } },
          { interests: { $exists: false } },
          { favoriteLocations: { $exists: false } },
          { availibility: { $exists: false } },
          { provider: { $exists: false } },
          { friends: { $exists: false } },
          { blocked: { $exists: false } },
          { pendingFriendRequests: { $exists: false } },
          { notifications: { $exists: false } },
          { isAdmin: { $exists: false } },
          { karmaScore: { $exists: false } },
          { qualityBadge: { $exists: false } },
          { eventsAttended: { $exists: false } },
          { eventsHosted: { $exists: false } },
          { lastMinuteCancels: { $exists: false } },
          { bio: { $exists: false } },
          { tags: { $exists: false } },
          { location: { $exists: false } },
          { lang: { $exists: false } },
        ],
      },
      {
        $set: {
          avatar: "",
          interests: [],
          favoriteLocations: [],
          availibility: [],
          provider: "credentials",
          friends: [],
          blocked: [],
          pendingFriendRequests: [],
          notifications: [],
          isAdmin: false,
          karmaScore: 100,
          qualityBadge: "bronze",
          eventsAttended: 0,
          eventsHosted: 0,
          lastMinuteCancels: 0,
          bio: "",
          tags: [],
          location: "",
          lang: "en",
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json(
      {
        message: "✅ User data uniformity enforced",
        matched: result.matchedCount,
        modified: result.modifiedCount,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
