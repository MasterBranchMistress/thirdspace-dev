import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

import { DBS, COLLECTIONS } from "@/lib/constants";

import { UserDoc, UserStatusDoc } from "@/lib/models/User";
import { UserFeedDoc } from "@/lib/models/UserFeedDoc";
import detectMediaType from "@/utils/detect-media-type/detectMediaType";
import { authOptions } from "@/lib/authOptions";
import { getServerSession } from "next-auth";
import { awardKarma } from "@/utils/karma/awardKarma";
import { getUserRanking } from "@/utils/karma/getRanking";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const { content, attachments = [] } = await req.json();
    const session = await getServerSession(authOptions);

    // Basic validations
    if (!content || typeof content !== "string" || content.length > 300) {
      return NextResponse.json(
        { error: "Invalid status content" },
        { status: 400 },
      );
    }

    if (attachments && !Array.isArray(attachments)) {
      return NextResponse.json(
        { error: "Attachments must be an array" },
        { status: 400 },
      );
    }

    const parsedAttachments = attachments.map((url: string) => ({
      url,
      type: detectMediaType(url) || "unknown",
    }));

    const client = await clientPromise;
    const db = client.db(DBS._THIRDSPACE);
    const statusCollection = db.collection<UserStatusDoc>(
      COLLECTIONS._USER_STATUSES,
    );
    const userCollection = db.collection<UserDoc>(COLLECTIONS._USERS);
    const feedCollection = db.collection<UserFeedDoc>(COLLECTIONS._USER_FEED);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const postingUser = await userCollection.findOne({
      _id: new ObjectId(session?.user.id),
    });

    if (!postingUser) {
      return NextResponse.json(
        { error: "Posting user not found" },
        { status: 404 },
      );
    }

    const _id = new ObjectId();

    const newStatus: UserStatusDoc = {
      _id,
      author: postingUser?.firstName + " " + postingUser?.lastName,
      authorUsername: postingUser.username,
      authorAvatar: postingUser?.avatar,
      userId: new ObjectId(id),
      sourceId: _id.toString(),
      content: content.trim(),
      createdAt: new Date(),
      attachments: parsedAttachments,
      comments: [],
      qualityBadge: postingUser.qualityBadge,
      karmaScore: postingUser.karmaScore,
    };

    const result = await statusCollection.insertOne(newStatus);
    const user = await userCollection.findOne({ _id: new ObjectId(id) });
    const userPrivacyLevel = user?.visibility;

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    //TODO: IF THERE IS SOMETHING MISSING IN YOUR FEED, POST IT IN HERE. DUMMY :)
    const actorPayload = {
      id: String(postingUser._id),
      firstName: postingUser.firstName,
      lastName: postingUser.lastName,
      username: postingUser.username,
      avatar: postingUser.avatar,
      qualityBadge: postingUser.qualityBadge,
      karmaScore: postingUser.karmaScore,
    };

    // 1. Insert feed item for the user themselves
    await feedCollection.insertOne({
      userId: postingUser._id,
      type: "profile_status_updated",
      actor: actorPayload,
      sourceId: newStatus._id.toString(),
      target: {
        status: {
          content: content.trim(),
          attachments: parsedAttachments,
          sourceId: newStatus._id.toString(),
        },
      },
      timestamp: new Date().toISOString(),
    });

    const recipients = new Set<string>();

    if (userPrivacyLevel === "friends") {
      (user.friends || []).forEach((f: any) => recipients.add(String(f)));
    } else if (
      userPrivacyLevel === "followers" ||
      userPrivacyLevel === "public"
    ) {
      (user.followers || []).forEach((f: any) => recipients.add(String(f)));
      (user.friends || []).forEach((f: any) => recipients.add(String(f)));
    }

    recipients.delete(String(user._id));

    const now = new Date().toISOString();
    const feedDocs = Array.from(recipients).map((recipientId) => ({
      userId: new ObjectId(recipientId),
      type: "profile_status_updated" as const,
      actor: actorPayload,
      sourceId: newStatus.sourceId,

      target: {
        status: {
          content: content.trim(),
          attachments: parsedAttachments,
          sourceId: newStatus._id.toString(),
        },
      },
      timestamp: now,
    }));

    if (feedDocs.length > 0) {
      await feedCollection.insertMany(feedDocs);
    }

    //add Karma and caculate promoted
    // console.log("STATUS ROUTE: before karma");
    // console.log("user onboarded", user.onboarded);
    // console.log("old karma", user.karmaScore);

    const oldRank = getUserRanking(postingUser.karmaScore ?? 0);

    const rewardKarma = postingUser.onboarded
      ? await awardKarma(String(postingUser._id), "status")
      : { awarded: 0 };

    const currentKarma = postingUser.karmaScore ?? 0;
    const awardedAmount = rewardKarma.awarded ?? 0;
    const newKarmaScore = currentKarma + awardedAmount;
    const newRank = getUserRanking(newKarmaScore);

    if (oldRank !== newRank && postingUser.onboarded) {
      const sourceId = `${postingUser._id}:promoted-${newRank}`;

      const promotedActorPayload = {
        id: String(postingUser._id),
        firstName: postingUser.firstName,
        lastName: postingUser.lastName,
        username: postingUser.username,
        avatar: postingUser.avatar,
        qualityBadge: newRank,
        karmaScore: newKarmaScore,
      };

      await userCollection.updateOne(
        { _id: postingUser._id },
        {
          $set: {
            qualityBadge: newRank,
            karmaScore: newKarmaScore,
          },
        },
      );

      await feedCollection.updateMany(
        { "actor.id": String(postingUser._id) },
        {
          $set: {
            "actor.karmaScore": newKarmaScore,
            "actor.qualityBadge": newRank,
          },
        },
      );

      await feedCollection.insertOne({
        userId: postingUser._id,
        type: "user_promoted" as const,
        actor: promotedActorPayload,
        sourceId,
        target: {
          promotion: {
            newRank,
            karmaScore: newKarmaScore,
          },
          status: {
            content: content.trim(),
            attachments: [],
            sourceId,
          },
        },
        timestamp: now,
      });

      const promotionFeedDocs = Array.from(recipients).map((recipientId) => ({
        userId: new ObjectId(recipientId),
        type: "user_promoted" as const,
        actor: promotedActorPayload,
        sourceId,
        target: {
          promotion: {
            newRank,
            karmaScore: newKarmaScore,
          },
          status: {
            content: content.trim(),
            attachments: [],
            sourceId,
          },
        },
        timestamp: now,
      }));

      if (promotionFeedDocs.length > 0) {
        await feedCollection.insertMany(promotionFeedDocs);
      }

      await userCollection.updateOne(
        {
          _id: postingUser._id,
        },
        {
          $set: {
            qualityBadge: newRank,
          },
        },
      );

      await feedCollection.updateMany(
        {
          "actor.id": String(postingUser._id),
        },
        {
          $set: {
            "actor.karmaScore": newKarmaScore,
            "actor.qualityBadge": newRank,
          },
        },
      );
    }

    return NextResponse.json({
      result,
      ok: true,
      id: result.acknowledged,
      content,
      attachments,
      rewardKarma: rewardKarma?.awarded,
      totalKarma: newKarmaScore,
      newRank: newRank,
    });
  } catch (error) {
    console.error("Error posting status:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}
