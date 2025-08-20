import React from "react";
import { FeedStats } from "./FeedStats";
import { Image } from "@heroui/react";
import { ObjectId } from "mongodb";
import dynamic from "next/dynamic";
import { useInView } from "react-intersection-observer";

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
      address?: string;
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

const EventMiniMap = dynamic(
  () => import("@/components/event-mini-map/eventMiniMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-40 rounded-md bg-default-100 animate-pulse" />
    ),
  }
);

export default function FeedCardFooter({
  type,
  target,
  actor,
}: FeedCardFooterProps) {
  const hasCoords =
    typeof target?.location?.lat === "number" &&
    typeof target?.location?.lng === "number" &&
    target.location.lat !== 0 &&
    target.location.lng !== 0;

  const { ref, inView } = useInView({ triggerOnce: true, rootMargin: "200px" });

  return (
    <div className="flex flex-col items-center gap-1 tracking-tight w-full text-center px-3">
      {[
        "joined_event",
        "hosted_event",
        "event_coming_up",
        "event_is_popular",
      ].includes(type) && (
        <div
          ref={ref}
          className="flex flex-col gap-1 w-full justify-center align-middle"
        >
          <p className="font-bold tracking-tight text-small mx-1 pb-2">
            {target?.location?.name ??
              target?.location?.address ??
              "Somewhere mysterious"}
          </p>
          {inView && hasCoords && (
            <EventMiniMap
              lat={target?.location?.lat}
              lng={target?.location?.lng}
              interactive={false}
            />
          )}
        </div>
      )}

      {type === "profile_avatar_updated" && (
        <Image
          src={target?.snippet}
          height={400}
          alt="new-profile-pic"
          className="z-30 rounded-xl object-cover mb-4"
        />
      )}

      <div className="flex justify-evenly gap-10 w-[90%]">
        <FeedStats />
      </div>
    </div>
  );
}
