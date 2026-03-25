import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { faker } from "@faker-js/faker";
import { COLLECTIONS, DBS, EVENT_STATUSES, TEST_IDS } from "@/lib/constants";
import { EventDoc } from "@/lib/models/Event";
import { ObjectId } from "mongodb";
import { Attachment } from "@/types/user-feed";
import {
  buildTagMatchKeysFromNormalized,
  normalizeTag,
} from "@/utils/metadata/tag-handling/normalizeTags";
import { UserDoc } from "@/lib/models/User";

const TAG_POOL = [
  "bowling",
  "music",
  "coding",
  "food",
  "gaming",
  "outdoors",
  "smash bros",
  "board games",
  "coffee",
  "hiking",
  "basketball",
  "movies",
  "study group",
  "karaoke",
  "anime",
];

function makeAttachment(): Attachment {
  return {
    type: "image",
    url: faker.image.urlLoremFlickr({ width: 800, height: 600 }),
  };
}

function toPoint(lng: number, lat: number) {
  return {
    type: "Point",
    coordinates: [lng, lat],
  };
}

function buildEventTags() {
  const tags = faker.helpers.arrayElements(TAG_POOL, {
    min: 1,
    max: 4,
  });

  const normalizedTags = Array.from(
    new Set(tags.map(normalizeTag).filter(Boolean)),
  );
  const tagMatchKeys = buildTagMatchKeysFromNormalized(normalizedTags);

  return {
    tags,
    normalizedTags,
    tagMatchKeys,
  };
}

function buildNearbyLocation(baseLat: number, baseLng: number) {
  // Rough local jitter for nearby testing
  const latOffset = faker.number.float({
    min: -0.08,
    max: 0.08,
    fractionDigits: 6,
  });
  const lngOffset = faker.number.float({
    min: -0.08,
    max: 0.08,
    fractionDigits: 6,
  });

  const lat = Number((baseLat + latOffset).toFixed(6));
  const lng = Number((baseLng + lngOffset).toFixed(6));

  return {
    name: `${faker.location.streetAddress()}, ${faker.location.city()}, ${faker.location.state()}`,
    address: `${faker.location.streetAddress()}, ${faker.location.city()}, ${faker.location.state({ abbreviated: true })}`,
    lat,
    lng,
    geo: toPoint(lng, lat),
  };
}

export async function POST(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db(DBS._THIRDSPACE);

    const {
      count = 25,
      radiusKm = 15,
      centerLat = 26.2034, // Mission, TX area default
      centerLng = -98.3253,
      hostId: incomingHostId,
    } = await req.json().catch(() => ({}));

    const safeCount = Math.max(1, Math.min(Number(count) || 25, 200));

    const defaultHostId = new ObjectId(TEST_IDS._HOST_ID);
    const hostId =
      incomingHostId && ObjectId.isValid(incomingHostId)
        ? new ObjectId(incomingHostId)
        : defaultHostId;

    const otherIds = TEST_IDS._OTHER_IDS
      .filter((id) => ObjectId.isValid(id))
      .map((id) => new ObjectId(id));

    const allPossiblePeople = [hostId, ...otherIds];

    const now = new Date();

    const eventsToInsert: EventDoc[] = Array.from({ length: safeCount }).map(
      () => {
        const { tags, normalizedTags, tagMatchKeys } = buildEventTags();

        const location = buildNearbyLocation(centerLat, centerLng);

        const attendees = faker.helpers.arrayElements(otherIds, {
          min: 0,
          max: Math.min(otherIds.length, 12),
        });

        const uniqueAttendees = Array.from(
          new Map(attendees.map((id) => [String(id), id])).values(),
        );

        const comments = Array.from({
          length: faker.number.int({ min: 0, max: 4 }),
        }).map(() => {
          const commenterId = faker.helpers.arrayElement(allPossiblePeople);

          return {
            userId: commenterId,
            commenter: {
              avatar: faker.image.avatar(),
              username: faker.internet.username(),
              firstName: faker.person.firstName(),
              lastName: faker.person.lastName(),
            },
            text: faker.lorem.sentence(),
            timestamp: faker.date.recent({ days: 14 }),
            replies: [],
          };
        });

        const recurring = faker.datatype.boolean({ probability: 0.2 });
        const recurrenceRule = recurring
          ? faker.helpers.arrayElement(["daily", "weekly", "monthly"] as const)
          : "none";

        const date = faker.date.soon({ days: 45 });
        const createdAt = faker.date.recent({ days: 10 });
        const updatedAt = faker.date.between({ from: createdAt, to: now });

        const attachmentCount = faker.number.int({ min: 0, max: 4 });
        const attachments = Array.from(
          { length: attachmentCount },
          makeAttachment,
        );

        const selectedHost = faker.helpers.arrayElement(allPossiblePeople);

        const event: EventDoc = {
          sourceId: new ObjectId().toHexString(),
          title: faker.helpers.arrayElement([
            "Smash Bros Night",
            "Coffee and Code",
            "Study Group Meetup",
            "Board Game Hangout",
            "Pickup Basketball",
            "Anime Watch Party",
            "Karaoke Night",
            "Food Crawl",
            "Movie Night",
            "Hiking Meetup",
          ]),
          description: faker.lorem.paragraph(),
          date,
          startTime: faker.helpers.arrayElement([
            "09:00",
            "11:30",
            "14:00",
            "18:00",
            "19:30",
            "20:15",
          ]),
          location,
          host: selectedHost as never,
          hostId: selectedHost,
          attendees: uniqueAttendees,
          tags,
          normalizedTags,
          tagMatchKeys,
          comments,
          status: EVENT_STATUSES._ACTIVE,
          createdAt,
          updatedAt,
          timestamp: createdAt,
          banned: [],
          attachments,
          public: faker.datatype.boolean({ probability: 0.9 }),
          recurring,
          recurrenceRule,
          recurrenceEndDate: recurring
            ? faker.date.soon({ days: 120, refDate: date })
            : undefined,
          recurringParentEventId: undefined,
          costInfo: {
            splitMode: faker.helpers.arrayElement([
              "free",
              "host_covers",
              "split_evenly",
            ] as const),
            totalEstimated: faker.number.int({ min: 0, max: 300 }),
            currency: "USD",
          },
          orbiters: faker.helpers.arrayElements(otherIds, {
            min: 0,
            max: Math.min(otherIds.length, 8),
          }),
          views: faker.number.int({ min: 0, max: 300 }),
          sparks: faker.helpers.arrayElements(otherIds, {
            min: 0,
            max: Math.min(otherIds.length, 15),
          }),

          baseScore: faker.number.int({ min: 0, max: 100 }),
        };

        return event;
      },
    );

    const result = await db
      .collection<EventDoc>(COLLECTIONS._EVENTS)
      .insertMany(eventsToInsert);

    return NextResponse.json({
      message: `✅ ${result.insertedCount} events created`,
      insertedCount: result.insertedCount,
      insertedIds: Object.values(result.insertedIds).map(String),
    });
  } catch (error) {
    console.error("Create test events error:", error);

    return NextResponse.json(
      { error: "Failed to create test events" },
      { status: 500 },
    );
  }
}
