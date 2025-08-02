"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { FeedBackground } from "@/components/background-animations/UserFeedBackground";
import LoadingSpinner from "@/components/spinner/spinner";
import LoadingPage from "@/components/spinner/LoadingPage";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!session && status !== "loading") {
      router.push("/login");
    }
  }, [session, status]);

  if (status === "loading") {
    return <LoadingPage />;
  }

  return <FeedBackground />;
}
