import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";

import { DBS, COLLECTIONS } from "@/lib/constants";
import { authOptions } from "@/lib/authOptions";

import { UserDoc, UserStatusDoc } from "@/lib/models/User";
import { UserFeedDoc } from "@/lib/models/UserFeedDoc";
import { getGravatarUrl } from "@/utils/gravatar";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    const avatarsOfUsersWhoBoosted = [];

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const joinedId = id;

    const feedItemId = id.split(":")[0];

    if (!ObjectId.isValid(feedItemId)) {
      return NextResponse.json(
        { message: "Invalid feed item id" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db(DBS._THIRDSPACE);

    const usersCollection = db.collection<UserDoc>(COLLECTIONS._USERS);
    const userFeedCollection = db.collection<UserFeedDoc>(
      COLLECTIONS._USER_FEED,
    );

    const sender = await usersCollection.findOne({
      _id: new ObjectId(session.user.id),
    });

    if (!sender) {
      return NextResponse.json(
        { message: "Authenticated user not found" },
        { status: 404 },
      );
    }

    const feedItem = await userFeedCollection.findOne({
      sourceId: joinedId,
    });

    if (!feedItem) {
      return NextResponse.json(
        { message: "Feed item not found" },
        { status: 404 },
      );
    }

    if (feedItem.type !== "user_promoted") {
      return NextResponse.json(
        { message: "Only promotion posts can be boosted" },
        { status: 400 },
      );
    }

    const promotedUserId = feedItem.actor?.id;

    if (!promotedUserId || !ObjectId.isValid(promotedUserId)) {
      return NextResponse.json(
        { message: "Promoted user not found on feed item" },
        { status: 400 },
      );
    }

    const isSelf = promotedUserId.toString() === sender._id.toString();

    if (isSelf) {
      return NextResponse.json(
        { message: "User cannot boost their own promotion" },
        { status: 400 },
      );
    }

    const userHasKarma = (sender.karmaScore ?? 0) >= 1;

    if (!userHasKarma) {
      return NextResponse.json(
        { message: "User has insufficient karma to give" },
        { status: 400 },
      );
    }

    const promotionFeedItem = await userFeedCollection.findOne({
      sourceId: joinedId,
    });

    if (!promotionFeedItem) {
      return NextResponse.json(
        { message: "Backing promotion status not found" },
        { status: 404 },
      );
    }

    const alreadyBoosted = await userFeedCollection.findOne({
      sourceId: joinedId,
      boostedBy: {
        id: sender._id,
        avatar: sender?.avatar ?? getGravatarUrl(sender.email!),
        firstName: sender.firstName,
      },
    });

    if (alreadyBoosted) {
      return NextResponse.json(
        { message: "You already boosted this promotion" },
        { status: 409 },
      );
    }

    await usersCollection.updateOne(
      { _id: sender._id },
      {
        $inc: {
          karmaScore: -1,
        },
      },
    );

    await usersCollection.updateOne(
      { _id: new ObjectId(promotedUserId) },
      {
        $inc: {
          karmaScore: 1,
        },
      },
    );

    await userFeedCollection.updateOne(
      { sourceId: joinedId },
      {
        $inc: { boostCount: 1 },
        $addToSet: {
          boostedBy: {
            id: sender._id,
            avatar: sender?.avatar ?? getGravatarUrl(sender.email!),
            firstName: sender.firstName,
          },
        },
      },
    );

    const updatedStatus = await userFeedCollection.findOne({
      sourceId: id,
    });

    return NextResponse.json(
      {
        message: "Boost sent successfully",
        ok: true,
        feedItemId: id,
        alreadyBoosted: alreadyBoosted,
        boostCount: updatedStatus?.boostedCount ?? 0,
        boostedBy: updatedStatus?.boostedBy ?? [],
        status: updatedStatus,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("POST /api/feed/[id]/boost error:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
