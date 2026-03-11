import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { COLLECTIONS, DBS } from "@/lib/constants";
import { UserDoc, UserStatusDoc } from "@/lib/models/User";
import { CommentDoc } from "@/lib/models/Comment";
import { awardKarma } from "@/utils/karma/awardKarma";
import { getUserRanking } from "@/utils/karma/getRanking";
import { UserFeedDoc } from "@/lib/models/UserFeedDoc";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);

  const statusCollection = db.collection<UserStatusDoc>(
    COLLECTIONS._USER_STATUSES,
  );
  const userCollection = db.collection<UserDoc>(COLLECTIONS._USERS);
  const commentsCollection = db.collection<CommentDoc>(
    COLLECTIONS._STATUS_COMMENTS,
  );
  const feedCollection = db.collection<UserFeedDoc>(COLLECTIONS._USER_FEED);

  try {
    const body = await req.json();

    const content = typeof body.content === "string" ? body.content : "";
    const attachments = Array.isArray(body.attachments) ? body.attachments : [];

    const userId = typeof body.userId === "string" ? body.userId : null;
    const text = typeof body.text === "string" ? body.text.trim() : null;

    if (!userId || !text) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    if (!ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: "Invalid userId format" },
        { status: 400 },
      );
    }

    if (text.length > 500) {
      return NextResponse.json(
        { message: "Message too long" },
        { status: 400 },
      );
    }

    const parentCommentId =
      typeof body.parentCommentId === "string" &&
      ObjectId.isValid(body.parentCommentId)
        ? new ObjectId(body.parentCommentId)
        : undefined;

    const status = await statusCollection.findOne({ _id: new ObjectId(id) });
    if (!status) {
      return NextResponse.json(
        { message: "Status not found" },
        { status: 404 },
      );
    }

    const user = await userCollection.findOne({
      _id: new ObjectId(userId),
    });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const userPrivacyLevel = user.visibility;
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

    const now = new Date();
    const nowIso = now.toISOString();

    const oldKarmaScore = user.karmaScore ?? 0;
    const oldRank = getUserRanking(oldKarmaScore);

    const newComment = {
      _id: new ObjectId(),
      statusId: new ObjectId(id),
      userId: new ObjectId(user._id),
      commenter: {
        userId: String(user._id),
        avatar: user.avatar,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      text,
      timestamp: now,
      parentCommentId,
      sparks: 0,
      likes: 0,
    };

    await commentsCollection.insertOne(newComment);

    const isReply = !!newComment.parentCommentId;
    const isOwnStatus = String(status.userId) === String(user._id);

    let rewardKarma = 0;

    if (!isReply && !isOwnStatus) {
      const karmaResult = await awardKarma(String(user._id), "comment");
      rewardKarma = karmaResult?.awarded ?? 0;
    }

    const newKarmaScore = oldKarmaScore + rewardKarma;
    const newRank = getUserRanking(newKarmaScore);
    const wasPromoted = oldRank !== newRank;

    const actorPayload = {
      id: String(user._id),
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      avatar: user.avatar,
      qualityBadge: user.qualityBadge,
      karmaScore: user.karmaScore,
    };

    if (wasPromoted) {
      const promotedActorPayload = {
        ...actorPayload,
        qualityBadge: newRank,
        karmaScore: newKarmaScore,
      };

      const sourceId = `${user._id}:promoted-${newRank}`;

      await userCollection.updateOne(
        { _id: user._id },
        {
          $set: {
            qualityBadge: newRank,
            karmaScore: newKarmaScore,
          },
        },
      );

      await feedCollection.updateMany(
        { "actor.id": userId },
        {
          $set: {
            "actor.qualityBadge": newRank,
            "actor.karmaScore": newKarmaScore,
          },
        },
      );

      await feedCollection.insertOne({
        userId: user._id,
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
            attachments,
            sourceId,
          },
        },
        timestamp: nowIso,
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
            attachments,
            sourceId,
          },
        },
        timestamp: nowIso,
      }));

      if (promotionFeedDocs.length > 0) {
        await feedCollection.insertMany(promotionFeedDocs);
      }
    }

    return NextResponse.json(
      {
        comment: newComment,
        rewardKarma,
        promotion: wasPromoted
          ? {
              newRank,
              karmaScore: newKarmaScore,
            }
          : null,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}
