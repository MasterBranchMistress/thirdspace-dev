import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

import { DBS, COLLECTIONS } from "@/lib/constants";

import { UserDoc, UserStatusDoc } from "@/lib/models/User";
import { UserFeedDoc } from "@/lib/models/UserFeedDoc";
import detectMediaType from "@/utils/detect-media-type/detectMediaType";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const { content, attachments = [] } = await req.json();

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

    const _id = new ObjectId();

    const newStatus: UserStatusDoc = {
      _id,
      userId: new ObjectId(id),
      sourceId: _id.toString(),
      content: content.trim(),
      createdAt: new Date(),
      attachments: parsedAttachments,
      views: 0,
      sparks: 0,
    };

    const result = await statusCollection.insertOne(newStatus);
    const user = await userCollection.findOne({ _id: new ObjectId(id) });
    const userPrivacyLevel = user?.visibility;

    if (!user) return;

    const actorPayload = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      avatar: user.avatar,
    };

    // 1. Insert feed item for the user themselves
    await feedCollection.insertOne({
      userId: user._id,
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

    return NextResponse.json({
      status: "Status Uploaded!",
      result,
      id: result.acknowledged,
      content,
      attachments,
    });
  } catch (error) {
    console.error("Error posting status:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}
