import clientPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { COLLECTIONS, DBS } from "@/lib/constants";
import { EventDoc } from "@/lib/models/Event";
import { UserDoc } from "@/lib/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { canViewerSee } from "@/utils/user-privacy/canViewerSee";

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
  const viewer = await userCollection.findOne({
    _id: new ObjectId(session?.user.id),
  });

  try {
    // pagination
    const { searchParams } = new URL(req.url);
    const page = Math.max(Number(searchParams.get("page")) || 1, 1);
    const limit = Math.max(Number(searchParams.get("limit")) || 10, 1);
    const skip = (page - 1) * limit;

    if (user) {
      if (user?.shareJoinedEvents === false || !canViewerSee(user, viewer)) {
        return NextResponse.json(
          { message: "User isnt authorized to view this content" },
          {
            status: 403,
          }
        );
      }
    }

    const filter = {
      attendees: new ObjectId(id),
    };

    const [events, total] = await Promise.all([
      eventsCollection
        .find(filter)
        .sort({ date: -1 })
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
