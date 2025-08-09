// components/FeedFooterNav.tsx
"use client";

import { useRouter } from "next/navigation";
import Lottie from "lottie-react";
import addPost from "@/public/lottie/add-event.json";
import search from "@/public/lottie/search.json";
import events from "@/public/lottie/map-pin.json";
import dms from "@/public/lottie/comments.json";
import settings from "@/public/lottie/settings.json";
import backToTop from "@/public/lottie/boost.json";
import { Tooltip } from "@heroui/react";

export default function Footer() {
  const router = useRouter();

  const iconStyle = {
    height: "30px",
    width: "30px",
  };

  return (
    <nav className="fixed px-3 h-auto bottom-0 left-0 w-full bg-concrete border-t border-none shadow-none  z-50">
      <div className="flex py-1 flex-row justify-between items-center text-sm font-medium">
        <Tooltip content="Search Events, Hosts, or Other Orbiters!">
          <button
            className="hover:text-purple-600"
            onClick={() => router.push("/search")}
          >
            <Lottie animationData={search} loop autoplay style={iconStyle} />
          </button>
        </Tooltip>
        <Tooltip content="View Current Events">
          <button
            className="hover:text-purple-600"
            onClick={() => router.push("/my-events")}
          >
            <Lottie
              animationData={events}
              loop
              autoplay={true}
              style={iconStyle}
            />
          </button>
        </Tooltip>
        <Tooltip content="Add New Post">
          <button
            className="hover:text-purple-600"
            onClick={() => router.push("/settings")}
          >
            <Lottie animationData={addPost} loop autoplay style={iconStyle} />
          </button>
        </Tooltip>
        <Tooltip content="Open Chat">
          <button
            className="hover:text-purple-600"
            onClick={() => router.push("/messages")}
          >
            <Lottie animationData={dms} loop autoplay style={iconStyle} />
          </button>
        </Tooltip>
        <Tooltip content="Edit Profile">
          <button>
            <Lottie animationData={settings} loop autoplay style={iconStyle} />
          </button>
        </Tooltip>
      </div>
    </nav>
  );
}
