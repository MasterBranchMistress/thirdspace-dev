import { DBS, COLLECTIONS } from "@/lib/constants";
import { EventDoc } from "@/lib/models/Event";
import { UserDoc } from "@/lib/models/User";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/authOptions";
import { getServerSession } from "next-auth";
import { canViewerSee } from "@/utils/user-privacy/canViewerSee";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: "Missing host id" }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db(DBS._THIRDSPACE);
    const eventsCollection = db.collection<EventDoc>(COLLECTIONS._EVENTS);
    const userCollection = db.collection<UserDoc>(COLLECTIONS._USERS);
    const session = await getServerSession(authOptions);
    const viewerId = session?.user?.id ?? null;
    const viewer = viewerId
      ? await userCollection.findOne({ _id: new ObjectId(viewerId) })
      : null;

    const hostUser = await userCollection.findOne({ _id: new ObjectId(id) });
    if (!hostUser) {
      return NextResponse.json({ error: "Host not found" }, { status: 404 });
    }

    const filter: Record<string, unknown> = { host: new ObjectId(id) };
    console.log(
      "shareHostedEvents:",
      hostUser.shareHostedEvents,
      typeof hostUser.shareHostedEvents
    );
    console.log("canViewerSee result:", canViewerSee(hostUser, viewer));

    const allowed =
      hostUser.shareHostedEvents !== false && canViewerSee(hostUser, viewer);

    if (!allowed) {
      return NextResponse.json(
        { error: "User has hosted events privated" },
        { status: 403 }
      );
    }

    // ✅ pagination
    const { searchParams } = new URL(req.url);
    const page = Math.max(Number(searchParams.get("page")) || 1, 1);
    const limit = Math.max(Number(searchParams.get("limit")) || 10, 1);
    const skip = (page - 1) * limit;

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
