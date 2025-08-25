"use client";

import { Card, CardBody, Chip } from "@heroui/react";
import { EventDoc } from "@/lib/models/Event";
import AttachmentSwiper from "../swiper/swiper";
import logo from "@/public/third-space-logos/thirdspace-logo-5.png";
import Image from "next/image";
import {
  CheckCircleIcon,
  TrophyIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

type Props = {
  event: EventDoc & { eventType?: "hosted" | "joined" };
  onClick?: () => void;
};

export default function EventGridCard({ event, onClick }: Props) {
  const attachments = event.attachments ?? [];
  const Preview = () => {
    if (!attachments.length) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <Image src={logo} alt={event.description} width={300} height={300} />
        </div>
      );
    }
    return (
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-black/30">
        <AttachmentSwiper attachments={attachments} />
      </div>
    );
  };

  const getBadgeColor = () => {
    switch (event.status) {
      case "active":
        return "success";
      case "completed":
        return "default";
      case "canceled":
        return "danger";
      default:
        return "default";
    }
  };

  const getBadgeIcon = () => {
    switch (event.status) {
      case "active":
        return <CheckCircleIcon width={18} />;
      case "completed":
        return <TrophyIcon width={18} />;
      case "canceled":
        return <XCircleIcon width={18} />;
    }
  };

  return (
    <Card
      isPressable
      onPress={onClick}
      className="relative group h-80 w-full overflow-hidden"
      radius="none"
    >
      <CardBody className="p-0 h-full w-full">
        <Preview />
        <div className="flex flex-col justify-center">
          <div className="bg-black/30 font-bold tracking-tighter py-1 backdrop-blur-md text-white text-tiny text-center px-2 rounded-none z-10 shadow-2xl">
            {`${event.title}`}
          </div>
          {/* Overlay badge if multiple attachments */}
          {event.attendees.length > 0 ? (
            <div className="absolute bottom-2 right-2 bg-black/30 backdrop-blur-md text-white text-xs px-2 py-0.5 rounded-md z-10 shadow-2xl">
              {`+${event.attendees.length} Orbiter${event.attendees.length > 1 ? "s" : ""}`}
            </div>
          ) : (
            <div className="absolute tracking-tight font-medium bottom-2 right-2 bg-black/30 backdrop-blur-md text-white text-xs px-2 py-0.5 rounded-md z-10 shadow-2xl">
              Be the first to Orbit!
            </div>
          )}
        </div>
        {/* Badge in corner */}
        <div className="mt-1.5 ml-1.5 text-tiny tracking-wide z-20">
          {event.eventType === "hosted" && (
            <Chip
              startContent={getBadgeIcon()}
              color={getBadgeColor()}
              variant="shadow"
              size="sm"
            >
              {event.status === "completed" ? "Completed" : "Hosting"}
            </Chip>
          )}
          {event.eventType === "joined" && (
            <Chip
              startContent={getBadgeIcon()}
              color={getBadgeColor()}
              variant="shadow"
              size="sm"
            >
              {event.status === "completed" ? "Completed" : "In Orbit"}
            </Chip>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
