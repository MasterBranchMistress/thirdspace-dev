import clientPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { COLLECTIONS, DBS } from "@/lib/constants";
import { UserDoc } from "@/lib/models/User";
import { EventDoc } from "@/lib/models/Event";
import { generateEventFeed } from "@/utils/feed-generator/generateEventFeed";
import { generateUserFeed } from "@/utils/feed-generator/generateUserFeed";
import { FeedItem } from "@/types/user-feed";
import { shuffleFeed } from "@/utils/shuffle-feed/shuffleFeed";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);
  const usersCollection = db.collection<UserDoc>(COLLECTIONS._USERS);
  const eventsCollection = db.collection<EventDoc>(COLLECTIONS._EVENTS);
  const feedCollection = db.collection<FeedItem>(COLLECTIONS._USER_FEED);

  try {
    const user = await usersCollection.findOne({ _id: new ObjectId(id) });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // get friend ids
    const friendsIds = user.friends || [];

    //NOTE: I was just using this to debug empty state. Don't delete this or ill find you.
    // if (friendsIds.length === 0) {
    //   return NextResponse.json({
    //     message: "✅ No friends yet",
    //     events: [],
    //     pagination: { page: 1, limit: 0, total: 0, totalPages: 0 },
    //   });
    // }

    // pagination
    const { searchParams } = new URL(req.url);
    const page = Math.max(Number(searchParams.get("page")) || 1, 1);
    const limit = Math.max(Number(searchParams.get("limit")) || 10, 1);
    const skip = (page - 1) * limit;
    const sinceParam = searchParams.get("since");
    let sinceDate: Date | null = null;

    if (sinceParam) {
      const parsed = new Date(decodeURIComponent(sinceParam));
      if (!isNaN(parsed.getTime())) {
        sinceDate = parsed;
      }
    }

    // ✅ Fetch friends + recent events
    const [friends, events] =
      friendsIds.length > 0
        ? await Promise.all([
            usersCollection.find({ _id: { $in: friendsIds } }).toArray(),
            eventsCollection
              .find({
                $or: [
                  { host: { $in: friendsIds } },
                  { attendees: { $in: friendsIds } },
                ],
                status: "active",
                date: { $gte: new Date(Date.now() - 1000 * 60 * 60 * 24) },
              })
              .sort({ date: -1 })
              .toArray(),
          ])
        : [[], []];

    const feedQuery: any = { userId: user._id };
    if (sinceDate) {
      feedQuery.timestamp = { $gt: sinceDate };
    }

    // ✅ Generate feed items
    let userFeed: FeedItem[] = await feedCollection
      .find(feedQuery)
      .sort({ timestamp: -1 })
      .toArray();

    const generatedUserFeed = await generateUserFeed(user, friends, events);
    const generatedEventFeed = await generateEventFeed(user, events, friends);
    const combined = [...generatedUserFeed, ...generatedEventFeed];

    if (combined.length > 0) {
      await feedCollection.insertMany(combined);
    }

    userFeed = combined;

    const mergedFeed: FeedItem[] = userFeed; // Already sorted

    const total = mergedFeed.length;
    const paginatedFeed = mergedFeed.slice(skip, skip + limit);

    return NextResponse.json({
      message: "✅ Friends' events fetched",
      feed: paginatedFeed,
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
