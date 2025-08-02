import { useRouter } from "next/navigation";

// lib/api/handleRegisterUser.ts
export const handleRegisterUser = async (
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  bio: string,
  router: ReturnType<typeof useRouter>
) => {
  if (!firstName || !lastName || !email || !password || !bio) {
    // toast.error("Please complete all fields");
    return;
  }

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
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      console.log("Unable to register user", result);
      return result.error || "Something went wrong.";
    }

    router.push("/login");
  } catch (err) {
    console.error("Register error:", err);
    return "Server error. Please try again later.";
  }
};
