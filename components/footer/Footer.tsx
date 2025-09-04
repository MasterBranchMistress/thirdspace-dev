"use client";

import { useRouter } from "next/navigation";
import Lottie from "lottie-react";
import addPost from "@/public/lottie/add-event.json";

export default function Footer() {
  const router = useRouter();

  return (
    <div className="fixed bottom-1.5 left-1.5 z-50">
      <button
        onClick={() => router.push("/dashboard")} // TODO: change to open Modal
        className="rounded-full bg-white/20 backdrop-blur-xl border border-white/30 shadow-lg hover:scale-105 transition-transform"
      >
        <Lottie
          animationData={addPost}
          loop
          autoplay
          style={{ height: "25px", width: "25px" }}
        />
      </button>
    </div>
  );
}
