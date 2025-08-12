"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Image } from "@heroui/react";

export default function AttachmentSwiper({
  attachments,
}: {
  attachments: (string | { url: string; type?: string })[];
}) {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="w-full max-w-xl mx-auto">
      <Swiper
        modules={[Pagination]}
        spaceBetween={10}
        slidesPerView={1}
        pagination={{ dynamicBullets: true }}
        className="w-full bg-concrete mt-3 overflow-hidden pb-2"
        onSlideChange={(swiper) => {
          swiper.slides.forEach((slide) => {
            const vid = slide.querySelector("video") as HTMLVideoElement;
            if (vid) vid.pause();
          });

          // Play the active one
          const activeSlide = swiper.slides[swiper.activeIndex];
          const activeVideo = activeSlide.querySelector(
            "video"
          ) as HTMLVideoElement;
          if (activeVideo) {
            activeVideo.muted = true; // Required for autoplay
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
              {type === "video" || url?.match(/\.(mp4|mov|avi|webm|mkv)$/i) ? (
                <video
                  src={url}
                  controls={true}
                  loop
                  muted
                  playsInline
                  autoPlay={true}
                  className="h-[500px] object-fill rounded-md"
                />
              ) : (
                <Image
                  src={url}
                  width="100%"
                  // height={500}
                  alt={`Attachment ${index + 1}`}
                  className="w-full h-[500px] object-cover rounded-md"
                />
              )}
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
}
