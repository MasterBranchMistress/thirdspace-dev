import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { DBS, COLLECTIONS } from "@/lib/constants";

/**
 * 🔥 DEV-ONLY NUKE ENDPOINT
 * Deletes all documents from EVENTS, USER_FEED, and USER_STATUSES collections.
 * TODO: Delete this route before deploying to prod.
 * TODO: Optionally move to a protected dev dashboard in the future.
 */

export async function DELETE() {
  try {
    const client = await clientPromise;
    const db = client.db(DBS._THIRDSPACE);

    const collectionsToNuke = [
      COLLECTIONS._EVENTS,
      COLLECTIONS._USER_FEED,
      COLLECTIONS._USER_STATUSES,
    ];

    const results = await Promise.all(
      collectionsToNuke.map(async (collection) => {
        const res = await db.collection(collection).deleteMany({});
        return { collection, deletedCount: res.deletedCount };
      })
    );

    return NextResponse.json({
      message: "🔥 Collections nuked successfully.",
      results,
    });
  } catch (error) {
    console.error("❌ Nuke failed:", error);
    return NextResponse.json(
      {
        error: "Failed to nuke collections",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
