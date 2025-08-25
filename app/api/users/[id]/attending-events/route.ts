import clientPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { COLLECTIONS, DBS } from "@/lib/constants";
import { EventDoc } from "@/lib/models/Event";
import { UserDoc } from "@/lib/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // userId
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);
  const session = await getServerSession(authOptions);
  const eventsCollection = db.collection<EventDoc>(COLLECTIONS._EVENTS);
  const userCollection = db.collection<UserDoc>(COLLECTIONS._USERS);
  const user = await userCollection.findOne(new ObjectId(id));
  const userPrivacyLevel = user?.visibility;

  try {
    // pagination
    const { searchParams } = new URL(req.url);
    const page = Math.max(Number(searchParams.get("page")) || 1, 1);
    const limit = Math.max(Number(searchParams.get("limit")) || 10, 1);
    const skip = (page - 1) * limit;

    if (
      (user?.shareJoinedEvents === false &&
        user._id.toString() !== session?.user.id.toString()) ||
      userPrivacyLevel === "off"
    ) {
      return NextResponse.json(
        { message: "User has their joined events set to private" },
        {
          status: 200,
        }
      );
    }

    // filter for active + upcoming
    const now = new Date();
    const filter = {
      attendees: new ObjectId(id),
      status: "active",
      date: { $gte: now },
    };

    const [events, total] = await Promise.all([
      eventsCollection
        .find(filter)
        .sort({ date: 1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      eventsCollection.countDocuments(filter),
    ]);

    return NextResponse.json({
      message: "✅ Attending events fetched",
      events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
