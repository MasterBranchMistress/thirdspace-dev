import { getFuzzyMatchingTags } from "@/utils/tag-extractor/fuzzyTagMatcher";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userTags, candidateTags } = body;

    if (
      !Array.isArray(userTags) ||
      !Array.isArray(candidateTags) ||
      userTags.length === 0 ||
      candidateTags.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "userTags and candidateTags must be non-empty arrays of strings.",
        },
        { status: 400 },
      );
    }

    const matches = await getFuzzyMatchingTags(userTags, candidateTags);

    return NextResponse.json({ matches });
  } catch (err: any) {
    console.error("Fuzzy tag matching failed:", err.message);
    return NextResponse.json(
      { error: "Failed to perform fuzzy tag matching" },
      { status: 500 },
    );
  }
}
