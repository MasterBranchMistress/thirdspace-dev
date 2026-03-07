import clientPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { COLLECTIONS, DBS, EVENT_STATUSES } from "@/lib/constants";
import { UserDoc, UserStatusDoc } from "@/lib/models/User";
import { EventDoc } from "@/lib/models/Event";
import { generateEventFeed } from "@/utils/feed-generator/generateEventFeed";
import { generateUserFeed } from "@/utils/feed-generator/generateUserFeed";
import { FeedItem } from "@/types/user-feed";
import { upsertAtAnchor } from "@/utils/discoverability/feed-injection-logic/upsertAtAnchor";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);
  const usersCollection = db.collection<UserDoc>(COLLECTIONS._USERS);
  const eventsCollection = db.collection<EventDoc>(COLLECTIONS._EVENTS);
  const feedCollection = db.collection<FeedItem>(COLLECTIONS._USER_FEED);
  const statusCollection = db.collection<UserStatusDoc>(
    COLLECTIONS._USER_STATUSES,
  );

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
    const viewerId = new ObjectId(id);
    const skip = (page - 1) * limit;
    const sinceParam = searchParams.get("since");
    let sinceDate: Date | null = null;

    if (sinceParam) {
      const parsed = new Date(decodeURIComponent(sinceParam));
      if (!isNaN(parsed.getTime())) {
        sinceDate = parsed;
      }
    }

    // Fetch friends + recent events
    const [friends, events, statuses] = await Promise.all([
      usersCollection.find({ _id: { $in: friendsIds } }).toArray(),

      eventsCollection
        .find({
          status: EVENT_STATUSES._ACTIVE,
          $or: [{ host: viewerId }, { attendees: viewerId }],
        })
        .sort({ date: -1 })
        .toArray(),

      statusCollection
        .find({ userId: { $in: [...friendsIds, user._id] } })
        .toArray(),
    ]);

    const feedQuery: any = { userId: user._id };
    if (sinceDate) {
      feedQuery.timestamp = { $gt: sinceDate };
    }

    // ✅ Generate feed items
    let userFeed: FeedItem[] = await feedCollection
      .find(feedQuery)
      .sort({ timestamp: -1 })
      .toArray();

    const generatedUserFeed = await generateUserFeed(
      user,
      friends,
      events,
      statuses,
    );
    const generatedEventFeed = await generateEventFeed(user, events, friends);
    const combined = [...generatedUserFeed, ...generatedEventFeed];

    const [nearbyUsersRes, nearbyEventsRes] = await Promise.all([
      fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/users/${id}/get-nearby-users`,
        { method: "POST" },
      ),
      fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/users/${id}/get-nearby-events`,
        { method: "POST" },
      ),
    ]);

    const nearbyUsersData = await nearbyUsersRes.json();
    const nearbyEventsData = await nearbyEventsRes.json();

    const nearbyUsers = nearbyUsersData.users ?? [];
    const nearbyEvents = nearbyEventsData.events ?? [];

    let mergedFeed: any[] = [...combined];

    const discoverEventsId = `discover_events:${id}`;
    const discoverUsersId = `discover_users:${id}`;

    // Filter out friends + self from nearby users
    const friendSet = new Set(friendsIds.map(String));
    const filteredUsers = nearbyUsers.filter((u: any) => {
      const uid = String(u.id ?? u._id);
      return uid !== String(id) && !friendSet.has(uid);
    });

    // Filter out events already in feed (optional but nice)
    const feedEventIds = new Set(
      combined
        .map((x: any) => x.actor?.eventId)
        .filter(Boolean)
        .map((eid: any) => String(eid)),
    );
    const filteredEvents = nearbyEvents.filter((e: any) => {
      const eid = String(e.id ?? e._id);
      return !feedEventIds.has(eid);
    });
    const eventAnchor =
      mergedFeed.length >= 7 ? 7 : Math.min(1, mergedFeed.length);
    const userAnchor =
      mergedFeed.length >= 3 ? 3 : Math.min(0, mergedFeed.length);

    if (filteredEvents.length > 0 && user.onboarded) {
      mergedFeed = upsertAtAnchor(
        mergedFeed,
        {
          id: discoverEventsId,
          type: "discover_events",
          timestamp: new Date().toISOString(),
          data: {
            title: "Events near you",
            events: filteredEvents.slice(0, 6),
          },
        } as any,
        eventAnchor,
      );
    }

    if (filteredUsers.length > 0 && user.onboarded) {
      mergedFeed = upsertAtAnchor(
        mergedFeed,
        {
          id: discoverUsersId,
          type: "discover_users",
          timestamp: new Date().toISOString(),
          data: {
            title: "People you may know",
            users: filteredUsers,
          },
        } as any,
        userAnchor,
      );
    }

    if (combined.length > 0) {
      await feedCollection.insertMany(combined);
    }

    userFeed = combined;

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
      { status: 500 },
    );
  }
}
