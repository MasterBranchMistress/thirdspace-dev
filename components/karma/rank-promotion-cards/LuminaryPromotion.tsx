"use client";

import { FeedTarget, FeedUserActor } from "@/types/user-feed";
import { Avatar } from "@heroui/react";
import Lottie from "lottie-react";
import cheer from "@/public/lottie/astro.json";
import { Button } from "@heroui/button";
import RankBadge from "../rankBadge";
import { PromotionRankProps } from "./types";

export default function LuminaryPromotion({
  actor,
  target,
  timestamp,
}: PromotionRankProps) {
  const formattedTime =
    typeof timestamp === "string"
      ? new Date(timestamp).toLocaleDateString()
      : timestamp.toLocaleDateString();

  return (
    <div className="relative w-full mt-4 overflow-hidden rounded-none p-[1px] bg-none">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-70"
      >
        <source src="/videos/luminary.mp4" type="video/mp4" />
      </video>

      {/* Optional color overlay */}
      <div className="absolute inset-0 bg-primary/20 backdrop-blur-xs" />
      {/* Backdrop */}
      <div className="relative rounded-2xl bg-content1 px-6 py-10 flex flex-col items-center justify-center text-center gap-4">
        {/* Avatar */}
        <Avatar
          src={actor.avatar}
          name={actor.firstName}
          size="lg"
          isBordered
          color="primary"
        />

        {/* Promotion Text */}
        <div className="flex flex-col gap-1">
          <p className="text-lg text-secondary font-mono tracking-wider">
            @{actor.username}
          </p>
        </div>
        <RankBadge
          size="sm"
          karmaScore={target?.promotion?.karmaScore}
          className="mt-[-.5rem]"
        />
        <p>
          Your presence has helped shape what this community has become. <br />
          <br />
          As a Luminary, you’ve gone beyond building connections and creating
          experiences — you inspire the people around you. Through the energy,
          generosity, and leadership you bring to ThirdSpace, you help the
          community grow stronger every day. <br />
          <br />
          Thank you for being a guiding light here.
        </p>
        {/* Timestamp */}
        <Lottie
          animationData={cheer}
          loop={true}
          className="h-30 w-full my-[-1.5rem]"
        />
        <span className="text-xs text-white/70">{formattedTime}</span>
      </div>
    </div>
  );
}
