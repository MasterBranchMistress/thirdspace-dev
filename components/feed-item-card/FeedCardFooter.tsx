// components/feed/FeedCardFooter.tsx
import React from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@heroui/button";
import { faker } from "@faker-js/faker";
import { FeedStats } from "./FeedStats";

interface FeedCardFooterProps {
  type: string;
  actor?: {
    id?: string;
    name?: string;
    username?: string;
    avatar?: string;
    eventId?: string;
    eventName?: string;
    location?: {
      name: string;
      lat: number;
      lng: number;
    };
    totalAttendance?: number;
    startingDate?: string;
  };

  target: {
    location?: string;
    snippet?: string;
    eventId?: string;
    userId?: string;
    title?: string;
  };
}

function isEventActor(
  actor: FeedCardFooterProps["actor"]
): actor is { startingDate: string; eventId: string; eventName?: string } {
  return (
    !!actor &&
    typeof actor.startingDate === "string" &&
    typeof actor.eventId === "string"
  );
}

export default function FeedCardFooter({
  type,
  target,
  actor,
}: FeedCardFooterProps) {
  const router = useRouter();
  if (type === "friend_accepted") {
    return (
      <div className="flex justify-center items-center gap-10 pt-2 w-full">
        <FeedStats />
      </div>
    );
  }

  if (type === "joined_event") {
    return (
      <div className="flex flex-col items-center gap-1 w-full">
        <div className="flex gap-1">
          <p className="font-extrabold text-small">📍</p>
          <p className="font-extralight text-small">
            {target.location || "Roscoe's on 19, Hudson, FL"}
          </p>
        </div>
        <div className="flex justify-between gap-10 pt-2">
          <FeedStats />
        </div>
      </div>
    );
  }

  if (type === "profile_updated") {
    return (
      <div className="flex justify-center gap-10 pt-2 w-full">
        <FeedStats />
      </div>
    );
  }
  if (type === "event_coming_up") {
    return (
      <div className="flex justify-center gap-10 pt-2 w-full">
        <FeedStats />
      </div>
    );
  }

  return (
    <div className="flex gap-1">
      <p className="font-extrabold text-small">👀</p>
      <p className="font-extralight text-small">Activity noticed</p>
    </div>
  );
}
