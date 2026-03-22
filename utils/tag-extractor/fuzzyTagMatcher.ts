// lib/fuzzyTagMatch.ts
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

type FuzzyTagMatchResult = {
  matches: string[];
};

export async function getFuzzyMatchingTags(
  myTags: string[],
  candidateTags: string[],
): Promise<string[]> {
  if (!myTags.length || !candidateTags.length) {
    return [];
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            'You compare user interest tags for recommendation relevance in a social app. Return ONLY a valid JSON array of tags selected from the provided candidateTags array that represent the same interest or a very closely related subcategory of the userTags. Do not invent tags. Do not return broad category neighbors or loosely related activities. For example, "gaming" may match "co op gaming" or "fps", but "football" should not match "gaming". If no strong matches exist, return [].',
        },
        {
          role: "user",
          content: JSON.stringify({
            userTags: myTags,
            candidateTags,
          }),
        },
      ],
    });

    const content = response.choices[0].message.content || "[]";
    const parsed = JSON.parse(content);

    if (!Array.isArray(parsed)) return [];

    return parsed.filter((tag): tag is string => typeof tag === "string");
  } catch (err) {
    console.error("Fuzzy tag matching failed:", err);
    return [];
  }
}
