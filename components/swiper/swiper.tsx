"use client";

import React, { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { Image } from "@heroui/react";

export default function AttachmentSwiper({
  attachments,
  onDoubleTap,
  overlay,
}: {
  attachments: (string | { url: string; type?: string })[];
  onDoubleTap?: () => void;
  overlay?: React.ReactNode; // lets you pass Lottie overlay from parent
}) {
  if (!attachments || attachments.length === 0) return null;

  // Optional: stop double-tap from also triggering single tap logic elsewhere
  const clickTimeout = useRef<number | null>(null);

  const handleClick = () => {
    // If you *also* need single-tap behavior later, you can implement it here.
    // For now, do nothing.
  };

  const handleDoubleClick = () => {
    // Cancel any single-click action if you add one later
    if (clickTimeout.current) {
      window.clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
    }
    onDoubleTap?.();
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        className="relative w-full bg-concrete mt-3 overflow-hidden pb-2"
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        <Swiper
          modules={[Pagination]}
          spaceBetween={10}
          slidesPerView={1}
          pagination={{ dynamicBullets: true }}
          className="w-full"
          onSlideChange={(swiper) => {
            swiper.slides.forEach((slide) => {
              const vid = slide.querySelector("video") as HTMLVideoElement;
              if (vid) vid.pause();
            });

            const activeSlide = swiper.slides[swiper.activeIndex];
            const activeVideo = activeSlide.querySelector(
              "video",
            ) as HTMLVideoElement;
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

            return (
              <SwiperSlide key={index}>
                {type === "video" ||
                url?.match(/\.(mp4|mov|avi|webm|mkv)$/i) ? (
                  <video
                    src={url}
                    controls
                    loop
                    muted
                    playsInline
                    autoPlay
                    className="w-full h-full object-cover rounded-none"
                  />
                ) : (
                  <Image
                    src={url}
                    width="100%"
                    alt={`Attachment ${index + 1}`}
                    className="w-full h-full object-cover rounded-none"
                  />
                )}
              </SwiperSlide>
            );
          })}
        </Swiper>

        {/* Overlay slot (center pulse) */}
        {overlay ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            {overlay}
          </div>
        ) : null}
      </div>
    </div>
  );
}
