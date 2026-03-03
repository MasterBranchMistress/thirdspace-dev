"use client";

import React, { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { Image } from "@heroui/react";
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
  commentsAreOpen,
  controls,
  muted,
  hidePlayButton,
}: {
  controls?: boolean;
  isImage?: boolean;
  hidePlayButton?: boolean;
  commentsAreOpen?: boolean;
  muted?: boolean;
  loop?: boolean;
  eventId?: string;
  statusAuthor?: UserDoc;
  attachments: (string | { url: string; type?: string })[];
  onOpenStatus?: (statusId: string) => void;
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
          slidesPerView={1}
          pagination={{ dynamicBullets: true }}
          className="w-full"
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
                    <video
                      src={url}
                      controls={controls}
                      loop={true}
                      muted={muted}
                      playsInline
                      autoPlay
                      className={`w-full h-[${commentsAreOpen ? "50" : "100"}vh] object-${commentsAreOpen ? "fit" : "cover"} rounded-none`}
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
                  <Image
                    src={url}
                    width="100%"
                    alt={`Attachment ${index + 1}`}
                    className={`w-full h-[${commentsAreOpen ? "50" : "100"}vh] object-${commentsAreOpen ? "fit" : "cover"} rounded-none`}
                  />
                )}
              </SwiperSlide>
            );
          })}
        </Swiper>

        {/* {overlay ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            {overlay}
          </div>
        ) : null} */}
      </div>
    </div>
  );
}
