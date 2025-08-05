import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { isAuthorized } from "@/utils/auth";
import { DBS, COLLECTIONS } from "@/lib/constants";
import { UserStatusDoc } from "@/lib/models/UserStatusDoc";
import { UserDoc } from "@/lib/models/User";
import { UserFeedDoc } from "@/lib/models/UserFeedDoc";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { callerId, content, attachments } = await req.json();

    // Basic validations
    if (!content || typeof content !== "string" || content.length > 300) {
      return NextResponse.json(
        { error: "Invalid status content" },
        { status: 400 }
      );
    }

    if (attachments && !Array.isArray(attachments)) {
      return NextResponse.json(
        { error: "Attachments must be an array" },
        { status: 400 }
      );
    }

    //TODO: check session for authorization
    // const isAllowed = isAuthorized(callerId, id);

    // if (!isAllowed) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const client = await clientPromise;
    const db = client.db(DBS._THIRDSPACE);
    const statusCollection = db.collection<UserStatusDoc>(
      COLLECTIONS._USER_STATUSES
    );
    const userCollection = db.collection<UserDoc>(COLLECTIONS._USERS);
    const feedCollection = db.collection<UserFeedDoc>(COLLECTIONS._USER_FEED);

    const newStatus: UserStatusDoc = {
      _id: new ObjectId(),
      userId: id,
      content: content.trim(),
      createdAt: new Date(),
      attachments,
    };

    const result = await statusCollection.insertOne(newStatus);
    const user = await userCollection.findOne({ _id: new ObjectId(id) });

    if (!user) return;

    for (const friendId of user.friends || []) {
      await feedCollection.insertOne({
        userId: friendId, // feed owner is the friend
        type: "status_posted",
        actor: {
          id: id,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          avatar: user.avatar!,
        },
        target: {
          snippet: content.trim(),
          attachments,
        },
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      status: "Status Uploaded!",
      id: result.acknowledged,
      content,
      attachments,
    });
  } catch (error) {
    console.error("Error posting status:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
