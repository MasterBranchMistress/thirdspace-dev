export const handleRegisterUser = async (
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  bio: string,
) => {
  try {
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
        tags: [],
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
