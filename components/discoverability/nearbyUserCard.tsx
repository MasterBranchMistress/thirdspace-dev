"use client";

import React from "react";
import {
  Card,
  CardHeader,
  Avatar,
  Button,
  CardBody,
  CardFooter,
} from "@heroui/react";
import { UserDoc } from "@/lib/models/User";
import { useRouter } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { ResonanceMeter } from "./card-components/resonanceMeter";
import RankBadge from "../karma/rankBadge";

type Props = {
  user: UserDoc;
};

export function NearbyUserCard({ user }: Props) {
  const [isFollowed, setIsFollowed] = React.useState(false);
  const tags = user.tags ?? [];
  // const sharedTags = user.sharedTags ?? [];
  const router = useRouter();
  // console.log(`PASSED IN USER TO NEABRY USER, ${user.karmaScore}`);
  return (
    <Card
      className="w-full bg-primary/80 mt-3 shadow-none animate-slide-down rounded-2xl"
      isBlurred
      isPressable
      onPress={() => router.push(`/dashboard/profile/${user.id}`)}
    >
      <CardHeader className="justify-between items-start pb-3">
        <div className="flex gap-4 items-center justify-start">
          <Avatar
            isBordered
            radius="full"
            size="md"
            src={user.avatar}
            onClick={() => router.push(`/dashboard/profile/${user.id}`)}
          />

          <div className="flex flex-col justify-start items-start leading-tight">
            <h4 className="text-sm font-semibold text-default-800">
              {user.firstName} {user.lastName}
            </h4>
            <span className="text-xs text-default-500 max-w-[7rem] truncate min-w-0">
              @{user.username}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 shrink-0 items-end">
          <span className="px-3 py-0.5 text-xs font-medium bg-secondary text-primary rounded-full w-fit">
            {user.distanceMeters
              ? (user?.distanceMeters / 1069.34).toFixed(1)
              : 0}{" "}
            Miles Away 📍{" "}
          </span>
          <RankBadge size="sm" karmaScore={user.karmaScore} />
        </div>
      </CardHeader>

      <CardBody className="px-1 py-2 text-sm text-default-600 space-y-3">
        <div className="h-auto pb-3">
          <p className="leading-relaxed line-clamp-3 px-3 text-secondary text-center">
            {user.bio ?? "No bio yet."}
          </p>
        </div>

        {user.tags?.length ? (
          <div className="flex flex-wrap gap-2 shrink-0 px-2 justify-center">
            {user.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="text-xs bg-secondary text-primary font-bold px-2 py-1 rounded-full"
              >
                #{t}
              </span>
            ))}
          </div>
        ) : null}
        <ResonanceMeter score={Math.min(100, user.sharedTags.length * 25)} />
      </CardBody>

      <CardFooter className="flex justify-center gap-3 pt-3 text-sm">
        <div className="flex gap-1">
          <span className="font-semibold">{user.following?.length ?? 0}</span>
          <span className="text-default-500">Orbiting</span>
        </div>

        <div className="flex gap-1">
          <span className="font-semibold">{user.followers?.length ?? 0}</span>
          <span className="text-default-500">
            Orbiter
            {user.followers?.length && user?.followers?.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="flex gap-1">
          <span className="font-semibold">{user.friends?.length ?? 0}</span>
          <span className="text-default-500">
            Astro
            {user.friends?.length && user?.friends?.length === 1 ? "" : "s"}™
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}
