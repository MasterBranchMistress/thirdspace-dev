"use client";

import { formatDistanceToNow, format } from "date-fns";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Avatar,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Button,
  Dropdown,
} from "@heroui/react";
import React, { useMemo } from "react";
import FeedCardFooter from "./FeedCardFooter";
import { useRouter } from "next/navigation";
import { FeedEventActor, FeedItem, FeedUserActor } from "@/types/user-feed";
import {
  EllipsisVerticalIcon,
  ExclamationCircleIcon,
  EyeSlashIcon,
  UserMinusIcon,
} from "@heroicons/react/24/outline";
import AttachmentSwiper from "../swiper/swiper";
import { useBrowserLocation } from "@/utils/geolocation/get-user-location/getUserLocation";
import { getDistFromMiles } from "@/utils/geolocation/get-distance-from-event/getDistFromEvent";

interface FeedItemCardProps {
  item: FeedItem;
}

export default function FeedItemCard({ item }: FeedItemCardProps) {
  const { type, target, actor, timestamp } = item;

  const userLocation = useBrowserLocation();

  const eventDistance = useMemo(() => {
    if (
      userLocation.status === "success" &&
      target?.location?.lat &&
      target?.location?.lng
    ) {
      return getDistFromMiles(
        userLocation.coords.lat,
        userLocation.coords.lng,
        target.location.lat,
        target.location.lng
      )?.toFixed(1);
    }
    return null;
  }, [userLocation, target?.location]);

  // console.log("[FeedItemCard] distance (mi):", `${eventDistance} miles away`);

  const isUserActor = (
    a: FeedUserActor | FeedEventActor | null | undefined
  ): a is FeedUserActor => {
    return !!a && typeof (a as any).id === "string";
  };

  // console.log(!isUserActor(actor) && target);

  // console.log(isUserActor(actor), target);
  const buttonText = isUserActor(actor) ? "Follow" : null;

  const message =
    type === "event_is_popular"
      ? `"${target?.title}" is trending 🔥`
      : type === "event_coming_up" && !isUserActor(actor)
        ? `"${target?.title}" is coming up ⏰`
        : type === "hosted_event" && isUserActor(actor)
          ? ``
          : type === "hosted_event" && !isUserActor(actor)
            ? ``
            : type === "profile_avatar_updated" && isUserActor(actor)
              ? `${actor.firstName} updated their look 😎`
              : type === "profile_location_updated" && isUserActor(actor)
                ? `${actor.firstName} moved somewhere new 📍`
                : type === "profile_status_updated" && isUserActor(actor)
                  ? ``
                  : isUserActor(actor) &&
                    `${actor.firstName} is doing something cool 🤔`;

  const tags =
    type === "profile_tags_updated" && typeof target?.snippet === "string"
      ? target.snippet.split(",").map((tag) => tag.trim())
      : [];

  return (
    <Card
      radius="none"
      className="w-full shadow-none text-primary bg-concrete mb-7"
    >
      <CardHeader className="flex justify-between items-center">
        {/* Left side: avatar + user/event info */}
        <div className="flex gap-5">
          <div className="hover:cursor-pointer">
            <Avatar
              isBordered
              color="primary"
              radius="full"
              size="md"
              src={
                isUserActor(actor)
                  ? actor?.avatar
                  : actor?.avatar || "/misc/party.jpg"
              }
            />
          </div>
          {!isUserActor(actor) ? (
            <div className="flex flex-col gap-0.5 items-start justify-center w-full min-w-0">
              <h6
                className="text-sm tracking-tighter text-primary leading-snug
                     whitespace-normal break-words line-clamp-1"
              >
                {target?.host ?? target?.hostName}'s event has an Update!
              </h6>
              <p
                className="text-xs font-extralight tracking-tight text-primary leading-snug
                     whitespace-normal break-words"
              >
                {eventDistance} mi away •{" "}
                {target?.startingDate
                  ? format(new Date(target?.startingDate), "PPP p")
                  : "TBD"}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1 items-start justify-center">
              <h4 className="text-small font-extralight tracking-wide leading-none text-primary">
                {`${actor?.firstName || ""} ${actor?.lastName || ""}`.trim()}
              </h4>
              {isUserActor(actor) && (
                <h5 className="text-small tracking-tight text-primary">
                  @{actor?.username}
                </h5>
              )}
            </div>
          )}
        </div>

        {/* Right side: Orbit button + ellipses */}
        <div className="flex items-center shrink-0">
          {isUserActor(actor) && (
            <Button
              variant="shadow"
              size="sm"
              color="primary"
              className="p-1 text-xs rounded-full"
            >
              {buttonText}
            </Button>
          )}
          <Dropdown>
            <DropdownTrigger>
              <EllipsisVerticalIcon className="text-primary" width={27} />
            </DropdownTrigger>
            <DropdownMenu aria-label="Dynamic Actions">
              <DropdownItem
                key="hide"
                className="text-concrete bg-none"
                color="danger"
                variant="solid"
                endContent={<EyeSlashIcon width={20} />}
              >
                Hide Post
              </DropdownItem>
              <DropdownItem
                key="block"
                className="text-concrete bg-none"
                color="danger"
                variant="solid"
                endContent={<UserMinusIcon width={20} />}
              >
                Block User
              </DropdownItem>
              <DropdownItem
                key="report"
                className="text-concrete bg-danger"
                color="danger"
                variant="solid"
                endContent={<ExclamationCircleIcon width={20} />}
              >
                Report Post
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </CardHeader>

      <CardBody className="px-3 py-0 text-small text-center tracking-tight font-light">
        <p className="font-bold text-center tracking-tighter">{message}</p>
        <div className="flex flex-col justify-center items-center">
          {/* {type === "profile_bio_updated" && target?.snippet && (
            <span className="font-light mt-2 max-w-[50%]">
              {target.snippet}
            </span>
          )} */}
          {type === "profile_status_updated" && (
            <div className="font-light tracking-tight max-w-[100%] text-center">
              <p className="mx-auto text-sm mb-2">{target?.snippet}</p>
              {target?.attachments && target.attachments.length > 0 && (
                <div className="h-full">
                  <AttachmentSwiper attachments={target.attachments} />
                </div>
              )}
            </div>
          )}
          {type === "hosted_event" && !isUserActor(actor) && (
            <div className="mt-2 tracking-tight max-w-[100%] font-normal text-sm">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="font-bold text-sm text-center">
                  <span className="font-light">{target?.host} is hosting</span>
                  {"  "}"{target?.title}"
                </div>
                <div className="tracking-tight italic text-sm mt-3">
                  {target?.snippet}
                </div>
              </div>
              {target?.attachments && target.attachments.length > 0 && (
                <div className="h-full overflow-hidden">
                  <AttachmentSwiper attachments={target.attachments} />
                </div>
              )}
            </div>
          )}
          {type === "hosted_event" && isUserActor(actor) && (
            <div className="mt-2 tracking-tight max-w-[100%] font-normal text-sm">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="font-bold pb-1 text-sm text-center">
                  <span className="font-light">
                    {actor.firstName} is hosting
                  </span>
                  {"  "}"{target?.title}"
                </div>
                <div className="tracking-tight font-light italic text-sm mt-3">
                  {target?.snippet}
                </div>
              </div>
              {target?.attachments && target.attachments.length > 0 && (
                <div className="h-full overflow-hidden">
                  <AttachmentSwiper attachments={target.attachments} />
                </div>
              )}
            </div>
          )}
          {type === "profile_location_updated" && (
            <div className="mt-2 tracking-tight font-bold max-w-[100%]">
              {target?.snippet}
              {target?.attachments && target.attachments.length > 0 && (
                <div className="h-full overflow-hidden">
                  <AttachmentSwiper attachments={target.attachments} />
                </div>
              )}
            </div>
          )}
          {type === "event_is_popular" && (
            <div className="font-light max-w-[100%] mt-3 tracking-tight">
              {target?.description}
            </div>
          )}
          {type === "event_coming_up" && (
            <div className="my-3 font-light max-w-[100%] tracking-tight text-center">
              <div className="mx-auto text-sm mb-2">{target?.description}</div>
              {target?.attachments && target.attachments.length > 0 && (
                <div className="h-full overflow-hidden flex justify-center">
                  <AttachmentSwiper attachments={target.attachments} />
                </div>
              )}
            </div>
          )}
        </div>
        <span className="text-xs z-20 text-primary tracking-tight font-extralight text-center mt-3">
          {formatDistanceToNow(timestamp, { addSuffix: true })}
        </span>
      </CardBody>
      <CardFooter className="flex gap-2 px-2 w-full z-30">
        <FeedCardFooter type={type} target={target} actor={actor} />
      </CardFooter>
    </Card>
  );
}
