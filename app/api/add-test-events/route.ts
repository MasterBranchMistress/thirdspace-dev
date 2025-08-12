import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { faker } from "@faker-js/faker";
import { COLLECTIONS, DBS, EVENT_STATUSES, TEST_IDS } from "@/lib/constants";
import { EventDoc } from "@/lib/models/Event";
import { ObjectId } from "mongodb";
import { Attachment } from "@/types/user-feed";

export async function GET() {
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);

  // Known IDs for test data
  const hostId = new ObjectId(TEST_IDS._HOST_ID);
  const otherIds = TEST_IDS._OTHER_IDS.map((id) => new ObjectId(id));

  // Factory returns the right shape; no runtime use of `Attachment`
  // const makeAttachment = (): Attachment => {
  //   const isVideo = faker.datatype.boolean();
  //   return {
  //     type: isVideo ? "video" : "image",
  //     url: isVideo
  //       ? `${faker.internet.url()}`
  //       : faker.image.urlLoremFlickr({ width: 400 }),
  //   };
  // };

  // Building array of attachments here
  // const attachments = faker.helpers.multiple<Attachment>(makeAttachment, {
  //   count: faker.number.int({ min: 0, max: 5 }),
  // });

  const eventsToInsert: EventDoc[] = Array.from({ length: 5 }).map(() => {
    // Random subset of attendees
    const shuffledAttendees = faker.helpers.shuffle(otherIds);
    const someAttendees = shuffledAttendees.slice(
      0,
      faker.number.int({ min: 0, max: otherIds.length })
    );

    // Random messages
    const messages = Array.from({
      length: faker.number.int({ min: 1, max: 4 }),
    }).map(() => ({
      user: faker.helpers.arrayElement([hostId, ...otherIds]),
      text: faker.lorem.sentence(),
      timestamp: faker.date.recent(),
    }));

    return {
      title: faker.company.catchPhrase(),
      description: faker.lorem.paragraph(),
      date: faker.date.soon({ days: 1 }), // within 30 days
      startTime: faker.helpers.arrayElement([
        "09:00",
        "14:30",
        "18:00",
        "20:15",
      ]),
      location: {
        name: `${faker.location.streetAddress()}, ${faker.location.city()}, ${faker.location.state()}`,
        lat: parseFloat(faker.location.latitude().toString()),
        lng: parseFloat(faker.location.longitude().toString()),
      },
      host: faker.helpers.arrayElement([hostId, ...otherIds]),
      attendees: someAttendees,
      tags: faker.helpers.arrayElements(
        ["bowling", "music", "coding", "food", "gaming", "outdoors"],
        { min: 1, max: 3 }
      ),
      messages,
      // attachments,
      status: EVENT_STATUSES._ACTIVE,
      timestamp: new Date(),
      updatedAt: new Date(),
      banned: [],
      public: faker.datatype.boolean(),
      recurring: faker.datatype.boolean(),
      recurrenceRule: faker.helpers.arrayElement([
        "daily",
        "weekly",
        "monthly",
        undefined,
      ]) as EventDoc["recurrenceRule"],
      recurrenceEndDate: faker.date.soon({ days: 120 }),
      recurringParentEventId: faker.datatype.boolean()
        ? new ObjectId()
        : undefined,
      budgetInfo: {
        estimatedCost: faker.number.int({ min: 50, max: 1000 }),
        currency: faker.helpers.arrayElement(["USD", "EUR", "GBP"]),
        notes: faker.lorem.sentence(),
      },
      orbiters: faker.helpers.arrayElements(otherIds, {
        min: 0,
        max: otherIds.length,
      }),
    };
  });

  // Insert into DB
  const result = await db
    .collection<EventDoc>(COLLECTIONS._EVENTS)
    .insertMany(eventsToInsert);

  return NextResponse.json({
    message: `✅ ${result.insertedCount} events created`,
    insertedIds: result.insertedIds,
  });
}
