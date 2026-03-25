import { COLLECTIONS, DBS, EVENT_STATUSES } from "@/lib/constants";
import { EventDoc } from "@/lib/models/Event";
import { EventFeedDoc } from "@/lib/models/EventFeedDoc";
import { UserDoc } from "@/lib/models/User";
import clientPromise from "@/lib/mongodb";
import detectMediaType from "@/utils/detect-media-type/detectMediaType";
import { geocodeAddress } from "@/utils/geolocation/geocode-address/geocodeAddress";
import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/authOptions";
import {
  buildNormalizedTags,
  buildTagMatchKeysFromNormalized,
  normalizeTag,
} from "@/utils/metadata/tag-handling/normalizeTags";
import { getGravatarUrl } from "@/utils/gravatar";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const client = await clientPromise;
  const { id } = await context.params;
  const db = client.db(DBS._THIRDSPACE);
  const eventCollection = db.collection<EventDoc>(COLLECTIONS._EVENTS);
  const userCollection = db.collection<UserDoc>(COLLECTIONS._USERS);
  const feedCollection = db.collection<EventFeedDoc>(COLLECTIONS._USER_FEED);
  const session = await getServerSession(authOptions);

  try {
    const { data, attachments = [] } = await req.json();

    const user = id
      ? await userCollection.findOne({ _id: new ObjectId(id) })
      : null;
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const viewer = await userCollection.findOne({
      _id: new ObjectId(session?.user.id),
    });

    if (!data?.title || !data?.date || !data?.description || !data?.location) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }
    if (!Array.isArray(attachments)) {
      return NextResponse.json(
        { error: "Attachments must be an array" },
        { status: 400 },
      );
    }

    const parsedAttachments = attachments.map((url: string) => ({
      url,
      type: detectMediaType(url) || undefined,
    }));

    const locIn = data.location ?? {};
    let lat = typeof locIn.lat === "number" ? locIn.lat : undefined;
    let lng = typeof locIn.lng === "number" ? locIn.lng : undefined;

    if (lat == null || lng == null) {
      const addr = locIn.address ?? locIn.name ?? "";
      const geo = await geocodeAddress(addr);
      if (!geo) {
        throw new Error("Missing geo field on event location");
      }
      if (geo) {
        lat = geo.lat;
        lng = geo.lng;
      }
    }
    if (lat == null || lng == null) {
      return NextResponse.json(
        { error: "Could not geocode location" },
        { status: 422 },
      );
    }

    const normalizedTags = buildNormalizedTags(data.tags);
    const tagMatchKeys = buildTagMatchKeysFromNormalized(normalizedTags);

    // --- Insert Event ---
    const now = new Date();
    const baseEvent: EventDoc = {
      title: data.title,
      sourceId: new ObjectId().toString(),
      type: "hosted_event",
      description: data.description,
      attachments: parsedAttachments,
      date: new Date(data.date),
      startTime: data.startTime,
      location: {
        address: data.location.address,
        name: data.location?.name,
        lat,
        lng,
        geo: { type: "Point", coordinates: [lng, lat] },
      },
      hostId: user._id,
      host: {
        username: user.username,
        avatar: user?.avatar ?? getGravatarUrl(user?.email!),
      },
      attendees: [],
      qualityBadge: user.qualityBadge,
      karmaScore: user.karmaScore,
      tags: data.tags || [],
      normalizedTags: normalizedTags,
      tagMatchKeys: tagMatchKeys,
      comments: [],
      status: EVENT_STATUSES._ACTIVE,
      createdAt: now,
      updatedAt: now,
      banned: [],
      public: data.public ?? true,
      recurring: data.recurring ?? false,
      recurrenceRule: data.recurrenceRule,
      recurrenceEndDate: data.recurrenceEndDate
        ? new Date(data.recurrenceEndDate)
        : undefined,
      recurringParentEventId: undefined,
      costInfo: data.costInfo
        ? {
            splitMode: data.costInfo.splitMode,
            totalEstimated: data.costInfo.totalEstimated,
            currency: "USD",
          }
        : undefined,
      timestamp: now,
      orbiters: [],
      views: 0,
      sparks: [],
    };

    const eventResult = await eventCollection.insertOne(baseEvent);

    // --- Always insert self feed item ---
    const baseFeedEvent: Omit<EventFeedDoc, "_id"> = {
      userId: new ObjectId(String(user._id)),
      sourceId: new ObjectId().toString(),
      type: "hosted_event",
      actor: {
        firstName: user.firstName,
        lastName: user.lastName,
        hostUser: user.username!,
        avatar: user.avatar,
        eventId: eventResult.insertedId,
        eventName: data.title,
        qualityBadge: user.qualityBadge,
        karmaScore: user.karmaScore,
      },
      target: {
        userId: user._id,
        username: user.username,
        host: user.firstName!,
        title: data.title,
        snippet: data.description,
        attachments: parsedAttachments,
        views: 0,
        startingDate: data.date,
        location: {
          name: data.location.name,
          lat,
          lng,
          geo: { type: "Point", coordinates: [lng, lat] },
        },
        qualityBadge: user.qualityBadge,
        karmaScore: user.karmaScore,
      },
      timestamp: now,
    };
    await feedCollection.insertOne(baseFeedEvent);
    const visibility = user.visibility;

    const friendIds = (user.friends ?? []).map(String);
    const followerIds = (user.followers ?? []).map(String);

    let recipientIds: string[] = [];

    switch (visibility) {
      case "friends":
        recipientIds = friendIds;
        break;

      case "followers":
      case "public":
        recipientIds = Array.from(new Set([...friendIds, ...followerIds]));
        break;

      case "off":
      default:
        recipientIds = [];
        break;
    }

    if (recipientIds.length > 0) {
      const { _id: ignore, ...baseFeedEventNoId } = baseFeedEvent as any;

      const feedEvents: Omit<EventFeedDoc, "_id">[] = recipientIds.map(
        (recipientId) => ({
          ...baseFeedEventNoId,
          userId: new ObjectId(recipientId),
        }),
      );

      await feedCollection.insertMany(feedEvents);
    }

    // --- Handle recurrence
    if (data.recurring) {
      const occurrences: EventDoc[] = [];
      const currentDate = new Date(data.date);
      const numOccurrences = data.numOccurrences ?? 5;
      const rule = data.recurrenceRule || "weekly";

      for (let i = 0; i < numOccurrences; i++) {
        if (rule === "weekly") currentDate.setDate(currentDate.getDate() + 7);
        else if (rule === "daily")
          currentDate.setDate(currentDate.getDate() + 1);
        else if (rule === "monthly")
          currentDate.setMonth(currentDate.getMonth() + 1);

        // occurrences.push({
        //   title: data.title,
        //   type: "hosted_event",
        //   description: data.description,
        //   date: new Date(currentDate),
        //   startTime: data.startTime,
        //   attachments: parsedAttachments,
        //   location: {
        //     name: data.location?.name,
        //     lat: lat,
        //     lng: lng,
        //   },
        //   host: new ObjectId(user._id),
        //   attendees: [],
        //   tags: data.tags || [],
        //   messages: [],
        //   status: EVENT_STATUSES._ACTIVE,
        //   createdAt: new Date(),
        //   updatedAt: new Date(),
        //   banned: [],
        //   public: data.public ?? true,
        //   recurring: false,
        //   recurrenceRule: data.recurrenceRule,
        //   recurrenceEndDate: data.recurrenceEndDate
        //     ? new Date(data.recurrenceEndDate)
        //     : undefined,
        //   recurringParentEventId: eventResult.insertedId,
        //   budgetInfo: data.budgetInfo
        //     ? {
        //         estimatedCost: data.budgetInfo.estimatedCost ?? 0,
        //         currency: data.budgetInfo.currency,
        //         notes: data.budgetInfo.notes,
        //       }
        //     : undefined,
        //   timestamp: new Date(),
        //   orbiters: [],
        // } as EventDoc);
      }

      if (occurrences.length > 0) {
        await eventCollection.insertMany(occurrences);
      }
    }

    return NextResponse.json(
      {
        message: "✅ Event created",
        eventId: eventResult.insertedId,
        eventResult,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("[createEvent]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
