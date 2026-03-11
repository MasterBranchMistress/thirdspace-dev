"use client";

import React, { useEffect, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import {
  EffectCards,
  EffectCoverflow,
  EffectCube,
  EffectFade,
  EffectFlip,
  Pagination,
} from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import Image from "next/image";
import { UserDoc } from "@/lib/models/User";
import { PlayIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";
import { Card, CardBody } from "@heroui/react";
import { MapIcon } from "@heroicons/react/24/outline";
import { Attachment } from "@/types/user-feed";

export default function FeedAttachmentSwiper({
  statusId,
  onOpenStatus,
  attachments,
  commentsAreOpen,
  attachment,
  controls,
  eventId,
  muted = true,
}: {
  attachment?: Attachment;
  controls?: boolean;
  isImage?: boolean;
  onFeedPage?: boolean;
  onEventPage?: boolean;
  hidePlayButton?: boolean;
  commentsAreOpen?: boolean;
  muted?: boolean;
  loop?: boolean;
  eventId?: string;
  statusAuthor?: UserDoc;
  attachments?: (string | { url: string; type?: string })[];
  onOpenStatus?: (statusId: string) => void;
  statusId?: string;
  onDoubleTap?: () => void;
  overlay?: React.ReactNode;
}) {
  if (!attachments || attachments.length === 0) return null;
  const clickTimeout = useRef<number | null>(null);

  const handleClick = () => {
    if (!statusId) {
      return;
    }

    // Delay single click so double click can cancel it
    clickTimeout.current = window.setTimeout(() => {
      onOpenStatus?.(statusId);
      clickTimeout.current = null;
    }, 200);
  };

  return (
    <Card
      className={`${attachments.length > 1 ? `w-full rounded-xl h-[60vh]` : `w-[100vw] rounded-none h-auto`} flex-col p-0 m-0 bg-transparent shadow-none animate-appearance-in relative`}
      isBlurred={false} // disable blurred background
      isPressable
      isHoverable
    >
      <CardBody className="p-0">
        {attachment?.type === "video" ? (
          <div className="relative">
            <video
              src={attachment?.url}
              controls={controls}
              loop={true}
              muted={muted}
              playsInline
              autoPlay
            />

            {statusId && (
              <div
                className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!statusId) return;
                  onOpenStatus?.(statusId);
                }}
              >
                <div
                  className="pointer-events-auto z-10 bg-black/50 rounded-full p-4 
             transition-all duration-200 
             hover:bg-primary/70 hover:scale-110"
                >
                  <PlayIcon className="w-8 h-8 text-white" />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div
            className="relative w-full h-[60vh] overflow-hidden"
            onClick={() => {
              if (!statusId) return;
              onOpenStatus?.(statusId);
            }}
          >
            <Image
              src={
                attachment?.url ?? "/third-space-logos/thirdspace-logo-6.png"
              }
              alt={`Attachment:${attachment?.url}`}
              fill
              priority
              className="relative z-10 object-cover"
            />
          </div>
        )}
      </CardBody>
    </Card>
  );
}
