import { DBS, COLLECTIONS } from "@/lib/constants";
import { EventDoc } from "@/lib/models/Event";
import { UserDoc } from "@/lib/models/User";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);
  const eventsCollection = db.collection<EventDoc>(COLLECTIONS._EVENTS);
  const userCollection = db.collection<UserDoc>(COLLECTIONS._USERS);

  try {
    if (!id) {
      return NextResponse.json({ error: "Missing host id" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const viewerId = searchParams.get("viewerId"); //TODO: FOR TESTING PURPOSES, USE AUTH TOKEN WHEN YOU IMPLEMENT IT

    // ✅ pagination
    const page = Math.max(Number(searchParams.get("page")) || 1, 1);
    const limit = Math.max(Number(searchParams.get("limit")) || 10, 1);
    const skip = (page - 1) * limit;

    // ✅ build filter
    const filter: Record<string, unknown> = { host: new ObjectId(id) };

    if (viewerId && viewerId !== id) {
      const hostUser = await userCollection.findOne({
        _id: new ObjectId(id),
      });
      if (!hostUser) {
        return NextResponse.json({ error: "Host not found" }, { status: 404 });
      }

      const isFriend = hostUser.friends?.some(
        (friendId) => friendId.toString() === viewerId
      );
      if (!isFriend) filter.public = true;
    } else if (!viewerId) {
      filter.public = true;
    }

    // ✅ optional filters
    const status = searchParams.get("status");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");
    const tag = searchParams.getAll("tag");

    if (status) filter.status = status;
    if (fromDate && toDate) {
      filter.date = { $gte: new Date(fromDate), $lte: new Date(toDate) };
    } else if (fromDate) {
      filter.date = { $gte: new Date(fromDate) };
    } else if (toDate) {
      filter.date = { $lte: new Date(toDate) };
    }
    if (tag.length) filter.tags = { $in: tag };

    // ✅ run queries
    const [events, total] = await Promise.all([
      eventsCollection
        .find(filter)
        .sort({ date: 1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      eventsCollection.countDocuments(filter),
    ]);

    return NextResponse.json(
      {
        message: "✅ Hosted events fetched",
        events,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1,
        },
        appliedFilters: filter,
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
