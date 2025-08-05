import React from "react";
import { FeedStats } from "./FeedStats";
import { MapPinIcon } from "@heroicons/react/24/outline";
import { Image } from "@heroui/react";
import { FeedTarget } from "@/types/user-feed";
import { ObjectId } from "mongodb";

interface FeedCardFooterProps {
  type: string;
  actor?: {
    id?: string | ObjectId;
    name?: string;
    username?: string;
    avatar?: string;
    eventId?: string | ObjectId;
    eventName?: string;
    location?: {
      name?: string | undefined;
      lat: number;
      lng: number;
    };
    totalAttendance?: number;
    startingDate?: string | Date;
  };
  target?: {
    location?: string;
    snippet?: string;
    eventId?: string | ObjectId;
    userId?: string | ObjectId;
    title?: string;
    avatar?: string;
  };
}

export default function FeedCardFooter({
  type,
  target,
  actor,
}: FeedCardFooterProps) {
  const location =
    actor?.location?.name || target?.location || "🌍 Somewhere mysterious";
  return (
    <div className="flex flex-col items-center gap-1 w-full">
      {/* Optional location display for events */}
      {["joined_event", "hosted_event", "event_coming_up"].includes(type) && (
        <div className="flex gap-1 justify-center align-middle">
          <p className="font-extrabold text-small">
            <MapPinIcon width={15} />
          </p>
          <p className="font-extralight text-small pb-2">
            {target?.location || "Somewhere nearby"}
          </p>
        </div>
      )}
      {type === "profile_avatar_updated" && (
        <Image
          src={actor?.avatar}
          height={400}
          alt="new-profile-pic"
          className="z-30 rounded-xl object-cover mb-4"
        />
      )}
      <div className="flex justify-center gap-10 w-full">
        <FeedStats />
      </div>
    </div>
  );
}
