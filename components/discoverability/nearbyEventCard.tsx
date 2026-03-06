"use client";

import React from "react";
import { Card, CardHeader, CardBody, CardFooter, Avatar } from "@heroui/react";
import { Swiper, SwiperSlide } from "swiper/react";
import { EventDoc } from "@/lib/models/Event";
import Image from "next/image";
import { useRouter } from "next/navigation";

type Props = {
  event: EventDoc;
};

export function EventDiscoverabilityCard({ event }: Props) {
  const router = useRouter();
  // Format distance
  const distanceMiles = event.distanceMeters
    ? (event.distanceMeters / 1609.34).toFixed(1)
    : "—";

  if (!event.startTime) return;

  // Format time
  const eventTime = new Date(event.date).toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });

  const mediaUrl =
    event.attachments?.[0]?.url ?? "/third-space-logos/thirdspace-logo-6.png";

  // Generate hype meter (0–5 bars)
  const totalBars = 5;
  const filledBars = Math.round(
    (event.popularity ? event.popularity / 100 : 0) * totalBars,
  );

  console.log("This Event: ", mediaUrl);

  return (
    <Card
      className="w-full flex-col h-[60vh] mt-3 shadow-xl animate-slide-down relative bg-primary bg-center bg-no-repeat"
      isBlurred={false} // disable blurred background
      style={{
        backgroundImage: `url(${mediaUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
      isPressable
      isHoverable
      onPress={() => router.push(`/dashboard/event/${String(event._id)}`)}
    >
      <div className="absolute inset-0 z-0 overflow-hidden rounded-xl">
        <Swiper
          slidesPerView={1}
          loop={event.attachments && event.attachments.length > 0}
          pagination={{ clickable: true }}
          className="h-full w-full"
        >
          {(event.attachments && event.attachments.length > 0
            ? event.attachments
            : [
                {
                  type: "image",
                  url: "/third-space-logos/thirdspace-logo-3.png",
                },
              ]
          ).map((att, i) => (
            <SwiperSlide key={i} className="relative h-full w-full">
              {att.type === "image" ? (
                <Image
                  src={att.url}
                  alt={`Attachment ${i}`}
                  fill
                  className="object-cover"
                  priority
                />
              ) : att.type === "video" ? (
                <video
                  src={att.url}
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              ) : null}
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
      <div className="absolute inset-0 rounded-xl pointer-events-none"></div>
      <CardHeader className="flex justify-between items-start pb-3">
        <div className="flex gap-4 shrink-0 items-center justify-start">
          <Avatar
            isBordered
            radius="full"
            size="sm"
            src={event.hostAvatar ?? "/placeholder-event.png"}
            onClick={() =>
              router.push(`/dashboard/user/${String(event.host._id)}`)
            }
          />
          <div className="flex flex-col shrink-0 justify-start leading-tight">
            <h4 className="text-xs font-semibold text-default-800">
              {event.title}
            </h4>
            <span className="text-xs text-default-500">
              Hosted by {event.hostName}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 items-end">
          <span className="px-3 py-0.5 text-xs font-medium bg-secondary text-primary rounded-full w-fit">
            {distanceMiles} mi away 📍
          </span>
          <span className="px-3 bg-secondary text-primary text-xs py-0.5 font-medium rounded-full w-fit">
            {eventTime}
          </span>
        </div>
      </CardHeader>

      <CardBody className="px-1 py-2 text-sm text-default-600 space-y-3 mt-auto"></CardBody>

      <CardFooter className="flex justify-between gap-3 pt-3 text-sm">
        {event.tags?.length ? (
          <div className="flex flex-wrap gap-2 shrink-0 px-2 justify-center">
            {event.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="text-xs bg-secondary text-primary font-bold px-2 py-1 rounded-full"
              >
                #{t}
              </span>
            ))}
          </div>
        ) : null}

        {/* Hype meter */}
        <div className="flex flex-col items-center mt-2">
          <div className="flex gap-1 mb-1">
            {Array.from({ length: totalBars }).map((_, i) => (
              <div
                key={i}
                className={`w-2 rounded-full ${
                  i < filledBars
                    ? "bg-gradient-to-t from-pink-500 via-red-500 to-yellow-400"
                    : "bg-gray-300"
                }`}
                style={{
                  height: `${Math.random() * 6 + 6}px`,
                  animation: `shimmy 1.5s ease-in-out infinite`,
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>
          <p className="text-xs bg-none text-muted-foreground text-center animate-fade-in">
            {filledBars >= 4
              ? "🔥 Hot event"
              : filledBars >= 2
                ? "🌟 Worth checking out"
                : "✨ Quiet event"}
          </p>
        </div>
      </CardFooter>

      <style jsx>{`
        @keyframes shimmy {
          0%,
          100% {
            transform: scaleY(1);
          }
          50% {
            transform: scaleY(1.3);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.5s ease forwards;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </Card>
  );
}
