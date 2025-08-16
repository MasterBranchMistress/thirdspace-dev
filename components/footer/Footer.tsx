// components/FeedFooterNav.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Lottie from "lottie-react";
import addPost from "@/public/lottie/add-event.json";
import search from "@/public/lottie/search.json";
import events from "@/public/lottie/map-pin.json";
import dms from "@/public/lottie/comments.json";
import settings from "@/public/lottie/settings.json";
import { Tooltip } from "@heroui/react";
import ProfileSettingsModal from "../profile-settings/profileSettings";

export default function Footer() {
  const router = useRouter();
  const [hidden, setHidden] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const lastY = useRef(0);
  const ticking = useRef(false);

  // appear on scroll up, hide on scroll down
  useEffect(() => {
    lastY.current = window.scrollY || 0;

    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const y = window.scrollY || 0;
        const delta = y - lastY.current;
        if (Math.abs(delta) > 8) {
          setHidden(delta > 0);
          lastY.current = y;
        }

        ticking.current = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const iconStyle = { height: "25px", width: "25px" };

  return (
    <div>
      <nav
        className={[
          "fixed bottom-0 left-0 w-full z-50",
          "px-3 bg-concrete border-t border-none shadow-none",
          "transform transition-transform duration-300",
          hidden ? "translate-y-full" : "translate-y-0",
          "pb-[max(env(safe-area-inset-bottom),0px)]",
        ].join(" ")}
      >
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
              <Lottie animationData={events} loop autoplay style={iconStyle} />
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
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="hover:text-purple-600"
            >
              <Lottie
                animationData={settings}
                loop
                autoplay
                style={iconStyle}
              />
            </button>
          </Tooltip>
        </div>
      </nav>
      <ProfileSettingsModal
        isOpen={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />
    </div>
  );
}
