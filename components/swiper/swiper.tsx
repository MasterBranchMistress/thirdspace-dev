"use client";

import React, { useRef } from "react";
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

export default function AttachmentSwiper({
  statusAuthor,
  statusId,
  onOpenStatus,
  attachments,
  onDoubleTap,
  overlay,
  loop,
  isImage,
  onProfilePage,
  onEventPage,
  commentsAreOpen,
  controls,
  muted,
  hidePlayButton,
}: {
  onProfilePage?: boolean;
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
  attachments: (string | { url: string; type?: string })[];
  onOpenStatus?: (
    statusId: string,
    options?: { areCommentsOpen?: boolean },
  ) => void;
  statusId?: string;
  onDoubleTap?: () => void;
  overlay?: React.ReactNode;
}) {
  const router = useRouter();
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
    <div className="w-full max-w-xl mx-auto">
      <div
        className="relative w-full bg-concrete overflow-hidden cursor-pointer"
        onClick={handleClick}
        // onDoubleClick={handleDoubleClick}
      >
        <Swiper
          modules={[Pagination]}
          spaceBetween={10}
          slidesPerView={"auto"}
          pagination={{ dynamicBullets: true }}
          onSlideChange={(swiper) => {
            swiper.slides.forEach((slide) => {
              const vid = slide.querySelector(
                "video",
              ) as HTMLVideoElement | null;
              if (vid) vid.pause();
            });

            const activeSlide = swiper.slides[swiper.activeIndex];
            const activeVideo = activeSlide.querySelector(
              "video",
            ) as HTMLVideoElement | null;
            if (activeVideo) {
              activeVideo.muted = true;
              activeVideo.play().catch(() => {});
            }
          }}
        >
          {attachments.map((attachment, index) => {
            const isObj = typeof attachment === "object";
            const url = isObj ? attachment.url : attachment;
            const type = isObj ? attachment.type : undefined;

            if (type !== "video") {
              isImage = true;
            }

            return (
              <SwiperSlide key={index}>
                {type === "video" ||
                url?.match(/\.(mp4|mov|avi|webm|mkv)$/i) ? (
                  <div className="relative">
                    {commentsAreOpen && (
                      <div className="relative w-full h-[60vh] overflow-hidden">
                        {/* Background blurred video */}
                        <video
                          src={url}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="absolute inset-0 w-full h-full object-cover blur-lg scale-110 opacity-70"
                        />
                        <div className="absolute inset-0 bg-black/20 pointer-events-none" />
                        {/* Foreground playable video */}
                        <video
                          src={url}
                          controls={controls}
                          autoPlay
                          loop
                          muted={muted}
                          playsInline
                          className="relative z-10 w-full h-full object-contain"
                        />
                      </div>
                    )}
                    {!commentsAreOpen && (
                      <video
                        src={url}
                        controls={controls}
                        loop={true}
                        muted={muted}
                        playsInline
                        autoPlay
                        className={`w-full bg-black h-[100vh] object-cover  rounded-none`}
                      />
                    )}
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
                          className="pointer-events-auto bg-black/50 rounded-full p-4 
             transition-all duration-200 
             hover:bg-primary/70 hover:scale-110"
                          hidden={hidePlayButton}
                        >
                          <PlayIcon className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className={`relative w-full ${commentsAreOpen ? "h-[60vh]" : "h-[100vh]"} overflow-hidden`}
                  >
                    {/* Blurred background */}
                    <Image
                      src={url}
                      alt=""
                      fill
                      priority
                      className="object-cover blur-lg scale-110 opacity-70"
                    />

                    {/* Foreground image */}
                    <Image
                      src={url}
                      alt={`Attachment ${index + 1}`}
                      fill
                      priority
                      className={`relative ${commentsAreOpen ? "object-cover" : "object-contain"} z-10`}
                    />
                  </div>
                )}
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>
    </div>
  );
}
