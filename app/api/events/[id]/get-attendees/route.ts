import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { DBS, COLLECTIONS } from "@/lib/constants";
import { UserDoc } from "@/lib/models/User";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const client = await clientPromise;
    const db = client.db(DBS._THIRDSPACE);
    const { id } = await context.params;

    const event = await db
      .collection(COLLECTIONS._EVENTS)
      .findOne({ _id: new ObjectId(id) });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const attendees = await db
      .collection<UserDoc>(COLLECTIONS._USERS)
      .find({
        _id: { $in: event.attendees.map((id: string) => new ObjectId(id)) },
      })
      .project({
        passwordHash: 0,
        email: 0,
        provider: 0,
        friends: 0,
        blocked: 0,
        pendingFriendRequests: 0,
        notifications: 0,
        isAdmin: 0,
        karmaScore: 0,
        qualityBadge: 0,
        eventsAttended: 0,
        eventsHosted: 0,
        lastMinuteCancels: 0,
        createdAt: 0,
        updatedAt: 0,
        usernameLastChangedAt: 0,
        bioLastUpdatedAt: 0,
        avatarLastUpdatedAt: 0,
        locationLastUpdatedAt: 0,
        statusLastUpdatedAt: 0,
        tagsLastupdatedAt: 0,
        joinedEventDate: 0,
        acceptedFriendDate: 0,
        addedEventDate: 0,
        followers: 0,
        following: 0,
        avatarMetaData: 0,
        shareLocation: 0,
        shareHostedEvents: 0,
        shareJoinedEvents: 0,
        visibility: 0,
        "location.lat": 0,
        "location.lng": 0,
        "location.geo": 0,
      }) // protect sensitive info
      .toArray();

    return NextResponse.json({ attendees });
  } catch (err) {
    console.error("Error fetching attendees", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
