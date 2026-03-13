import React from "react";
import SparkMeta from "./FeedStats";
import { Image } from "@heroui/react";
import { ObjectId } from "mongodb";
import dynamic from "next/dynamic";
import { useInView } from "react-intersection-observer";
import { PreviewUser } from "@/app/api/users/[id]/metadata/interests/friend-spark-preview/route";
import { UserDoc } from "@/lib/models/User";
import { SessionUser } from "@/types/user-session";

interface FeedCardFooterProps {
  type: string;
  userId?: string;
  viewer?: SessionUser;
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
  sourceId: string;
  hasSparked: boolean;
  friendPreviewUsers: PreviewUser[];
}

const EventMiniMap = dynamic(
  () => import("@/components/event-mini-map/eventMiniMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[100px] rounded-none bg-default-100 animate-pulse" />
    ),
  },
);

export default function FeedCardFooter({
  type,
  target,
  hasSparked,
  friendPreviewUsers,
  viewer,
}: FeedCardFooterProps) {
  const hasCoords =
    typeof target?.location?.lat === "number" &&
    typeof target?.location?.lng === "number" &&
    target.location.lat !== 0 &&
    target.location.lng !== 0;

  const { ref, inView } = useInView({ triggerOnce: true, rootMargin: "200px" });

  return (
    <div className="flex flex-col items-center gap-1 tracking-tight w-full text-center px-0">
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
          {/* <p className="font-bold tracking-tight text-small mx-1 pb-2">
            {target?.location?.name ??
              target?.location?.address ??
              "Somewhere mysterious"}
          </p> */}
          {inView && hasCoords && (
            <EventMiniMap
              lat={target?.location?.lat}
              lng={target?.location?.lng}
              interactive={false}
              user={viewer}
              eventTitle={target.title}
              previewOpen={false}
            />
          )}
        </div>
      )}

      {type === "profile_avatar_updated" && (
        <Image
          src={target?.snippet}
          height={400}
          alt="new-profile-pic"
          className="z-30 rounded-none object-cover mb-4"
        />
      )}

      <div className="flex justify-evenly gap-10 w-[90%]">
        <SparkMeta
          hasSparked={hasSparked}
          friendPreviewUsers={friendPreviewUsers}
        />
      </div>
    </div>
  );
}
