// lib/api/handleRegisterUser.ts
export const handleRegisterUser = async (
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  bio: string,
  tags: string[]
) => {
  try {
    const tagRes = await fetch("/api/extract-tags-from-bio", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ bio }),
    });

    const { tags: extractedTags } = await tagRes.json();

    // optional: only needed if you use `tags` in UI
    console.log("Extracted Tags:", extractedTags);
    if (!firstName || !lastName || !email || !password || !bio) {
      // toast.error("Please complete all fields");
      return;
    }
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        password,
        bio,
        tags: extractedTags,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      console.log("Unable to register user", result);
      return result.error || "Something went wrong.";
    }
  } catch (err) {
    console.error("Register error:", err);
    return "Server error. Please try again later.";
  }
};
