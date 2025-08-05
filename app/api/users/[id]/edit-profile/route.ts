import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { COLLECTIONS, DBS } from "@/lib/constants";
import { UserDoc } from "@/lib/models/User";
import { UserFeedDoc } from "@/lib/models/UserFeedDoc";
import { isAuthorized } from "@/utils/auth";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);
  const usersCollection = db.collection<UserDoc>(COLLECTIONS._USERS);
  const feedCollection = db.collection<UserFeedDoc>(COLLECTIONS._USER_FEED);

  try {
    const { callerId, ...updates } = await req.json();

    // Auth check
    if (!isAuthorized(callerId, id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const user = await usersCollection.findOne({ _id: new ObjectId(id) });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updateFields: Partial<UserDoc> = {};
    const changes: Record<string, any> = {};
    const feedItemsToInsert: UserFeedDoc[] = [];
    const timestamp = new Date().toISOString();

    // ✅ Username change
    if (updates.username && updates.username !== user.username) {
      const trimmed = updates.username.trim();
      updateFields.username = trimmed;
      changes.username = trimmed;
      updateFields.usernameLastChangedAt = new Date();
      feedItemsToInsert.push({
        userId: null!, // will fill for each friend later
        type: "profile_username_updated",
        actor: {
          id,
          firstName: user.firstName,
          lastName: user.lastName,
          username: trimmed,
          avatar: user.avatar!,
        },
        target: { snippet: trimmed },
        timestamp,
      });
    }

    // ✅ Bio
    if (typeof updates.bio === "string" && updates.bio.trim() !== user.bio) {
      const trimmed = updates.bio.trim();
      if (trimmed.length > 150) {
        return NextResponse.json(
          { error: "Bio must be 150 characters or fewer." },
          { status: 400 }
        );
      }
      updateFields.bio = trimmed;
      changes.bio = trimmed;
      updateFields.bioLastUpdatedAt = new Date();
      feedItemsToInsert.push({
        userId: null!,
        type: "profile_bio_updated",
        actor: {
          id,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          avatar: user.avatar!,
        },
        target: { snippet: trimmed },
        timestamp,
      });
    }

    // ✅ Avatar
    if (
      typeof updates.avatar === "string" &&
      updates.avatar.trim() !== user.avatar
    ) {
      const trimmed = updates.avatar.trim();
      updateFields.avatar = trimmed;
      changes.avatar = trimmed;
      updateFields.avatarLastUpdatedAt = new Date();
      feedItemsToInsert.push({
        userId: null!,
        type: "profile_avatar_updated",
        actor: {
          id,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          avatar: trimmed,
        },
        target: { snippet: trimmed },
        timestamp,
      });
    }

    // ✅ Location
    if (
      typeof updates.location === "string" &&
      updates.location.trim() !== user.location
    ) {
      const trimmed = updates.location.trim();
      updateFields.location = trimmed;
      changes.location = trimmed;
      updateFields.locationLastUpdatedAt = new Date();
      feedItemsToInsert.push({
        userId: null!,
        type: "profile_location_updated",
        actor: {
          id,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          avatar: user.avatar!,
        },
        target: { snippet: trimmed },
        timestamp,
      });
    }

    // ✅ Tags
    if (
      Array.isArray(updates.tags) &&
      updates.tags.join(",") !== (user.tags || []).join(",")
    ) {
      if (updates.tags.length > 5) {
        return NextResponse.json(
          { error: "You can only select up to 5 tags." },
          { status: 400 }
        );
      }
      const cleanedTags = updates.tags.map((t: string) =>
        t.trim().toLowerCase()
      );
      updateFields.tags = cleanedTags;
      changes.tags = cleanedTags;
      updateFields.tagsLastupdatedAt = new Date();
      feedItemsToInsert.push({
        userId: null!,
        type: "profile_tags_updated",
        actor: {
          id,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          avatar: user.avatar!,
        },
        target: { snippet: cleanedTags.join(", ") },
        timestamp,
      });
    }

    // ✅ Status
    if (
      typeof updates.status === "string" &&
      updates.status.trim() !== user.status
    ) {
      const trimmed = updates.status.trim();
      updateFields.status = trimmed;
      changes.status = trimmed;
      updateFields.statusLastUpdatedAt = new Date();
      feedItemsToInsert.push({
        userId: null!,
        type: "profile_status_updated",
        actor: {
          id,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          avatar: user.avatar!,
        },
        target: { snippet: trimmed },
        timestamp,
      });
    }

    // If no updates
    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json(
        { message: "No updates provided." },
        { status: 200 }
      );
    }

    // Save updated user profile
    await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updateFields, updatedAt: new Date() } }
    );

    // Insert feed items for each friend
    if (feedItemsToInsert.length > 0) {
      const recipientIds = [id, ...(user.friends || [])]; // includes self

      const feedItems = recipientIds.flatMap((recipientId) =>
        feedItemsToInsert.map((item) => ({
          ...item,
          userId: new ObjectId(recipientId),
        }))
      );

      await feedCollection.insertMany(feedItems);
    }

    return NextResponse.json(
      { message: "Profile updated", changes },
      { status: 200 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
