import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { COLLECTIONS, DBS } from "@/lib/constants";
import { UserDoc } from "@/lib/models/User";
import { UserFeedDoc } from "@/lib/models/UserFeedDoc";
import { isAuthorized } from "@/utils/auth";
import { getLocationImage } from "@/utils/get-location-images/getLocationImages";
import { syncUserUsername } from "@/utils/sync-user-username/syncUsername";
import { syncUserAvatar } from "@/utils/sync-user-avatar/syncAvatar";
import { awardKarma } from "@/utils/karma/awardKarma";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
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
    }

    // ✅ Bio
    if (typeof updates.bio === "string" && updates.bio.trim() !== user.bio) {
      const trimmed = updates.bio.trim();
      if (trimmed.length > 150) {
        return NextResponse.json(
          { error: "Bio must be 150 characters or fewer." },
          { status: 400 },
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
          karmaScore: user.karmaScore,
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
        userId: user._id,
        type: "profile_avatar_updated",
        actor: {
          id,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          avatar: trimmed,
          karmaScore: user.karmaScore,
        },
        target: { snippet: trimmed },
        timestamp,
      });
    }

    //visibility settings
    const allowed = ["public", "friends", "followers", "off"] as const;
    if (
      typeof updates.visibility === "string" &&
      allowed.includes(updates.visibility)
    ) {
      updateFields.visibility = updates.visibility;
      changes.visibility = updates.visibility;
    }

    //Share Joined event setting
    if (typeof updates.shareJoinedEvents === "boolean") {
      updateFields.shareJoinedEvents = updates.shareJoinedEvents;
      changes.shareJoinedEvents = updates.shareJoinedEvents;
    }
    //Share hosted events setting
    if (typeof updates.shareHostedEvents === "boolean") {
      updateFields.shareHostedEvents = updates.shareHostedEvents;
      changes.shareHostedEvents = updates.shareHostedEvents;
    }
    //Share location setting
    if (typeof updates.shareLocation === "boolean") {
      updateFields.shareLocation = updates.shareLocation;
      changes.shareLocation = updates.shareLocation;
    }

    //Location
    let locationName;
    if (typeof updates.location?.name === "string") {
      const trimmedLocation = updates.location.name.trim();

      const nextLat =
        typeof updates.location?.lat === "number" ? updates.location.lat : null;

      const nextLng =
        typeof updates.location?.lng === "number" ? updates.location.lng : null;

      const nextGeo =
        nextLat !== null && nextLng !== null
          ? {
              type: "Point" as const,
              coordinates: [nextLng, nextLat] as [number, number],
            }
          : undefined;

      const locationChanged =
        trimmedLocation !== (user.location?.name ?? "") ||
        nextLat !== (user.location?.lat ?? null) ||
        nextLng !== (user.location?.lng ?? null);

      if (locationChanged) {
        updateFields.location = {
          name: trimmedLocation,
          lat: nextLat,
          lng: nextLng,
          geo: nextGeo,
        };

        locationName = trimmedLocation;
        changes.location = updateFields.location;

        if (user.shareLocation === false) {
          return NextResponse.json(
            { message: "User has their location privated" },
            { status: 200 },
          );
        }

        let attachments: string[] = [];
        let photoCredit:
          | { name: string; username: string; profileUrl: string; link: string }
          | undefined;

        try {
          const result = await getLocationImage(trimmedLocation);
          if (result) {
            attachments = [result];
          }
        } catch (err) {
          console.error("Unable to get photo: ", err);
        }
      }
    }

    // ✅ Tags
    if (
      Array.isArray(updates.tags) &&
      updates.tags.join(",") !== (user.tags || []).join(",")
    ) {
      if (updates.tags.length > 5) {
        return NextResponse.json(
          { error: "You can only select up to 5 tags." },
          { status: 400 },
        );
      }
      const cleanedTags = updates.tags.map((t: string) =>
        t.trim().toLowerCase(),
      );
      updateFields.tags = cleanedTags;
      changes.tags = cleanedTags;
      updateFields.tagsLastupdatedAt = new Date();
    }

    // If no updates
    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json(
        { message: "No updates provided." },
        { status: 200 },
      );
    }

    // Save updated user profile
    await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updateFields, updatedAt: new Date() } },
    );

    // Insert feed items for each friend
    if (feedItemsToInsert.length > 0) {
      const recipientIds = [id, ...(user.friends || [])]; // includes self

      const feedItems = recipientIds.flatMap((recipientId) =>
        feedItemsToInsert.map((item) => ({
          ...item,
          userId: new ObjectId(recipientId),
        })),
      );

      await feedCollection.insertMany(feedItems);
    }

    const updatedUser = {
      ...user,
      ...updateFields,
      _id: user._id,
    };

    const avatar = updatedUser.avatar;
    const username = updatedUser.username;

    return NextResponse.json(
      {
        message: "Profile updated",
        changes,
        updates,
        user: updateFields,
        avatar,
        username,
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}
