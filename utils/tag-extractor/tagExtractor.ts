// lib/extractTags.ts
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

export async function extractInterestTagsFromBio(
  bio: string
): Promise<string[]> {
  if (bio.trim().length < 10) {
    return [];
  }
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content:
          "Extract up to 5 concise keywords from the user's bio. Respond ONLY with a JSON array of lowercase strings in this format ['keyword','keyword','keyword','keyword','keyword']. No explanation.",
      },
      {
        role: "user",
        content: bio,
      },
    ],
  });

  try {
    console.log("AI Response: ", response.choices[0].message.content);
    const content = response.choices[0].message.content || "[]";
    return JSON.parse(content);
  } catch (err) {
    console.error("Tag extraction failed:", err);
    return [];
  }
}
