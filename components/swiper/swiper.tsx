"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Image } from "@heroui/react";

export default function AttachmentSwiper({
  attachments,
}: {
  attachments: string[];
}) {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="w-full max-w-md mx-auto">
      <Swiper
        modules={[Pagination]}
        spaceBetween={10}
        slidesPerView={1}
        scrollbar={false}
        navigation={false}
        pagination={{ dynamicBullets: true }}
        className="w-90 bg-concrete mt-3  overflow-hidden pb-2"
      >
        {attachments.map((url, index) => (
          <SwiperSlide key={index}>
            <Image
              src={url}
              width={500}
              alt={`Attachment ${index + 1}`}
              className="w-full h-[400px] object-cover rounded-md pb-10"
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
