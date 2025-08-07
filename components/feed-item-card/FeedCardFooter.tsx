import React from "react";
import { FeedStats } from "./FeedStats";
import { Image } from "@heroui/react";
import { ObjectId } from "mongodb";
import MapPin from "@/public/lottie/map-pin.json";
import Lottie from "lottie-react";

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
      lat?: number;
      lng?: number;
    };
    totalAttendance?: number;
    startingDate?: string | Date;
  };
  target?: {
    location?: {
      name?: string;
      lat?: number;
      lng?: number;
    };
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
    actor?.location?.name || target?.location?.name || "Somewhere mysterious";

  return (
    <div className="flex flex-col items-center gap-1 tracking-tight w-full text-center px-3">
      {/* Optional location display for events */}
      {["joined_event", "hosted_event", "event_coming_up"].includes(type) && (
        <div className="flex gap-2justify-center align-middle">
          <Lottie
            animationData={MapPin}
            loop
            autoplay
            style={{
              height: "20px",
              width: "20px",
              marginBottom: "1rem",
            }}
          />
          <p className="font-extralight tracking-tight text-small mx-1 pb-2">
            {location}
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
