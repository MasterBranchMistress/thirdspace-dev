import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { faker } from "@faker-js/faker";
import { COLLECTIONS, DBS, EVENT_STATUSES, TEST_IDS } from "@/lib/constants";

// export interface EventDoc {
//   _id?: ObjectId;
//   title: string;
//   description: string;
//   date: Date;
//   location?: {
//     name?: string;
//     lat?: number;
//     lng?: number;
//   };
//   host: ObjectId;
//   attendees: ObjectId[];
//   tags?: string[];
//   messages?: {
//     user: ObjectId;
//     text: string;
//     timestamp: Date;
//   }[];
//   status?: string;
//   createdAt?: Date;
//   updatedAt?: Date;
//   banned?: ObjectId[];
//   public?: boolean;
// }

export async function GET() {
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);

  // ✅ Known IDs
  const hostId = TEST_IDS._HOST_ID;
  const otherIds = TEST_IDS._OTHER_IDS;

  // Generate N fake events
  const eventsToInsert = Array.from({ length: 5 }).map(() => {
    // random subset of attendees
    const shuffled = faker.helpers.shuffle(otherIds);
    const someAttendees = shuffled.slice(
      0,
      faker.number.int({ min: 0, max: otherIds.length })
    );

    // random messages
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
      date: faker.date.soon({ days: 30 }), // within 30 days
      location: {
        name: faker.location.city(),
        lat: parseFloat(faker.location.latitude().toString()),
        lng: parseFloat(faker.location.longitude().toString()),
      },
      host: hostId,
      status: faker.helpers.arrayElement([
        EVENT_STATUSES._CANCELED,
        EVENT_STATUSES._COMPLETED,
        EVENT_STATUSES._ACTIVE,
      ]),
      attendees: someAttendees,
      tags: faker.helpers.arrayElements(
        ["bowling", "music", "coding", "food", "gaming", "outdoors"],
        { min: 1, max: 3 }
      ),
      messages,
      createdAt: new Date(),
      updatedAt: new Date(),
      banned: [],
      public: faker.helpers.arrayElement([true, false]),
    };
  });

  // ✅ Insert them all
  const result = await db
    .collection(COLLECTIONS._EVENTS)
    .insertMany(eventsToInsert);

  return NextResponse.json({
    message: `✅ ${result.insertedCount} events created`,
    insertedIds: result.insertedIds,
  });
}
