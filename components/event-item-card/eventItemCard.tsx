"use client";

import { Card, CardBody, Chip } from "@heroui/react";
import { EventDoc } from "@/lib/models/Event";
import logo from "@/public/third-space-logos/thirdspace-logo-6.png";
import Image from "next/image";
import {
  CheckCircleIcon,
  TrophyIcon,
  XCircleIcon,
  PhotoIcon,
  PlayCircleIcon,
} from "@heroicons/react/24/outline";

type Props = {
  event: EventDoc & { eventType?: "hosted" | "joined" };
  onClick?: () => void;
};

export default function EventGridCard({ event, onClick }: Props) {
  const attachments = event.attachments ?? [];
  const firstAttachment = attachments[0];
  const remainingAttachmentCount = Math.max(attachments.length - 1, 0);

  const Preview = () => {
    if (!firstAttachment) {
      return (
        <div className="absolute inset-0 overflow-hidden bg-black/20">
          <Image
            src={logo}
            alt={event.description}
            fill
            className="object-cover"
          />
        </div>
      );
    }

    if (firstAttachment.type === "video") {
      return (
        <div className="absolute inset-0 overflow-hidden bg-black/30">
          <video
            src={firstAttachment.url}
            className="h-full w-full object-cover"
            autoPlay
            muted
            playsInline={true}
            loop={true}
            preload="metadata"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <PlayCircleIcon className="h-12 w-12 text-white/90" />
          </div>
        </div>
      );
    }

    return (
      <div className="absolute inset-0 overflow-hidden bg-black/30">
        <Image
          src={firstAttachment?.url || logo}
          alt={event.title}
          fill
          className="object-cover"
        />
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
      default:
        return null;
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
            <span className="block max-w-[90%] mx-auto truncate">
              {event.title}
            </span>
          </div>

          {attachments.length > 1 && (
            <div className="absolute top-8 right-2 bg-black/40 backdrop-blur-md text-white text-xs px-2 py-0.5 rounded-md z-10 shadow-2xl flex items-center gap-1">
              <PhotoIcon className="h-4 w-4" />
              {`+${remainingAttachmentCount}`}
            </div>
          )}

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
