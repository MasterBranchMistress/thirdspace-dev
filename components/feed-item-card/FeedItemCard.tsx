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
  user,
} from "@heroui/react";

import React, { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import FeedCardFooter from "./FeedCardFooter";
import { FeedEventActor, FeedItem, FeedUserActor } from "@/types/user-feed";
import {
  ArrowPathRoundedSquareIcon,
  ArrowRightStartOnRectangleIcon,
  BellAlertIcon,
  CheckBadgeIcon,
  EllipsisVerticalIcon,
  ExclamationCircleIcon,
  EyeSlashIcon,
  FlagIcon,
  HandRaisedIcon,
  HandThumbUpIcon,
  TrashIcon,
  UserMinusIcon,
  UserPlusIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import AttachmentSwiper from "../swiper/swiper";
import { useBrowserLocation } from "@/utils/geolocation/get-user-location/getUserLocation";
import { getDistFromMiles } from "@/utils/geolocation/get-distance-from-event/getDistFromEvent";
import { getGravatarUrl } from "@/utils/gravatar";
import { useRouter } from "next/navigation";
import { dropDownStyle } from "@/utils/get-dropdown-style/getDropDownStyle";
import { useUserRelationships } from "@/app/context/UserRelationshipsContext";
import Lottie from "lottie-react";
import sendmessage from "@/public/lottie/comments.json";
import {
  CheckCircleIcon,
  CheckIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/solid";

interface FeedItemCardProps {
  item: FeedItem;
}

export default function FeedItemCard({ item }: FeedItemCardProps) {
  const { data: session } = useSession();
  const logginedInUser = session?.user;
  const [avatarUrl, setAvatarUrl] = useState<string>();
  const { type, target, actor, timestamp } = item;
  const isUserActor = (
    a: FeedUserActor | FeedEventActor | null | undefined,
  ): a is FeedUserActor => {
    return !!a && typeof (a as any).id === "string";
  };
  useEffect(() => {
    if (isUserActor(actor)) {
      setAvatarUrl(actor.avatar ?? getGravatarUrl(actor?.email ?? ""));
    } else {
      setAvatarUrl(actor.avatar ?? "/misc/party.jpg");
    }
  }, [actor]);
  const { getRelationship } = useUserRelationships();

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
        target.location.lng,
      )?.toFixed(1);
    }
    return null;
  }, [userLocation, target?.location]);

  const buttonText = isUserActor(actor) ? (
    <Lottie animationData={sendmessage} style={{ width: "1.6rem" }} />
  ) : null;
  const router = useRouter();
  const relationship = isUserActor(actor)
    ? getRelationship(String(actor.id))
    : getRelationship(String(target?.userId));

  const isSelf = isUserActor(actor)
    ? String(logginedInUser?.id) === String(actor.id)
    : String(logginedInUser?.id) === String(target?.userId);

  const message =
    type === "event_is_popular"
      ? `"${target?.title}" is trending 🔥`
      : type === "event_coming_up"
        ? `"${target?.title}" is coming up ⏰`
        : type === "profile_avatar_updated" && isUserActor(actor)
          ? `${actor.firstName} updated their look 😎`
          : type === "hosted_event"
            ? ""
            : type === "joined_platform" && isUserActor(actor)
              ? `${actor.firstName} just joined ThirdSpace! 🚀`
              : type === "profile_location_updated" && isUserActor(actor)
                ? `${actor.firstName} moved somewhere new 📍`
                : type === "profile_bio_updated" && isUserActor(actor)
                  ? `${actor.firstName} updated their bio 🖊️`
                  : type === "profile_status_updated" && isUserActor(actor)
                    ? ``
                    : isUserActor(actor) &&
                      `${actor.firstName} is doing something cool 🤔`;

  return (
    <Card
      radius="none"
      className="w-full shadow-none text-primary bg-concrete mb-7"
    >
      <CardHeader className="flex justify-between items-center">
        {/* Left side: avatar + user/event info */}
        <div className="flex gap-5">
          <button
            onClick={() =>
              router.push(
                `/dashboard/profile/${isUserActor(actor) ? actor.id : target?.userId}`,
              )
            }
            className="hover:cursor-pointer"
          >
            <Avatar
              isBordered
              color="primary"
              radius="full"
              size="md"
              src={
                isUserActor(actor) ? avatarUrl : avatarUrl || "/misc/party.jpg"
              }
            />
          </button>
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
                {eventDistance ?? 0} mi away •{" "}
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
          {/* {isUserActor(actor) && (
            <button className="p-1 text-xs rounded-full">{buttonText}</button>
          )} */}
          <Dropdown classNames={dropDownStyle} backdrop="blur">
            <DropdownTrigger>
              <EllipsisVerticalIcon className="text-primary" width={24} />
            </DropdownTrigger>
            <DropdownMenu aria-label="Dynamic Actions">
              <DropdownItem
                key="share"
                className="text-concrete"
                color="primary"
                variant="solid"
                endContent={<ArrowRightStartOnRectangleIcon width={20} />}
              >
                Share
              </DropdownItem>
              <DropdownItem
                key="repost"
                className="text-concrete"
                color="primary"
                variant="solid"
                endContent={<ArrowPathRoundedSquareIcon width={20} />}
              >
                Repost
              </DropdownItem>
              {!isSelf ? (
                <>
                  <DropdownItem
                    key="report"
                    className="text-concrete bg-danger"
                    color="danger"
                    variant="solid"
                    endContent={<FlagIcon width={20} />}
                  >
                    Report Post
                  </DropdownItem>
                </>
              ) : null}
              {isSelf ? (
                <DropdownItem
                  key="delete_post"
                  className="text-concrete bg-danger"
                  color="danger"
                  variant="solid"
                  endContent={<TrashIcon width={20} />}
                >
                  Delete Post
                </DropdownItem>
              ) : null}
            </DropdownMenu>
          </Dropdown>
        </div>
      </CardHeader>

      <CardBody className="px-0 py-0 text-small text-center tracking-tight font-light">
        <p className="font-bold text-center tracking-tighter">{message}</p>
        <div className="flex flex-col justify-center items-center">
          {type === "profile_bio_updated" && target?.snippet && (
            <span className="font-light mx-2 my-2 max-w-[100%]">
              {target.snippet}
            </span>
          )}
          {type === "joined_platform" && isUserActor(actor) && (
            <Button
              size="sm"
              color="primary"
              variant="shadow"
              radius="md"
              className="mt-3"
              onPress={() => {
                //TODO: hook up say hi action here (send friend req, DM, etc.)
                console.log(`Said hi to ${actor.firstName}`);
              }}
            >
              Send a Spark ✨
            </Button>
          )}

          {type === "profile_status_updated" && isUserActor(actor) && (
            <div className="font-light tracking-tight max-w-[100%] text-center">
              <p className="mx-1.5 text-sm mb-2">{target?.status?.content}</p>
              {target?.status?.attachments &&
                target.status.attachments.length > 0 && (
                  <div className="h-full">
                    <AttachmentSwiper attachments={target.status.attachments} />
                  </div>
                )}
            </div>
          )}
          {type === "hosted_event" && !isUserActor(actor) && (
            <div className="mt-2 tracking-tight max-w-[100%] font-normal text-sm">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="flex flex-row font-bold text-sm text-center mb-2 items-center">
                  <span className="font-semibold shadow-lg shadow-primary border-1 border-primary py-1 mr-[-12] px-3 rounded-l-lg">
                    {target?.host} is hosting
                  </span>
                  <Button
                    size="sm"
                    variant="shadow"
                    color="primary"
                    className="text-secondary font-bold ml-2"
                    onPress={() =>
                      router.push(`/dashboard/event/${actor.eventId}`)
                    }
                  >
                    {target?.title}
                  </Button>
                </div>
                <div className="tracking-tight text-sm px-3 mt-3">
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
                <div className="font-bold text-sm text-center">
                  <span className="font-light">
                    {actor.firstName} is hosting
                  </span>
                  {"  "}"{target?.title}"
                </div>
                <div className="tracking-tight px-3 text-sm mt-3">
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
              <span className="px-3">{target?.description}</span>
              {target?.attachments && target.attachments.length > 0 && (
                <div className="h-full overflow-hidden">
                  <AttachmentSwiper attachments={target.attachments} />
                </div>
              )}
            </div>
          )}
          {type === "event_coming_up" && (
            <>
              <span className="mt-1">
                <Button
                  endContent={
                    <CheckCircleIcon
                      color="secondary"
                      width={20}
                      className="p-0 m-0"
                    />
                  }
                  size="sm"
                  variant="shadow"
                  color="success"
                  className="text-secondary font-bold"
                  onPress={() =>
                    router.push(`/dashboard/event/${actor.eventId}`)
                  }
                >
                  Check In
                </Button>
                <Button
                  endContent={
                    <EnvelopeIcon
                      color="primary"
                      width={20}
                      className="p-0 m-0"
                    />
                  }
                  size="sm"
                  variant="shadow"
                  color="primary"
                  className="text-secondary font-bold ml-2 mt-2"
                  onPress={() => console.log("set up modal for reason why")}
                  //TODO: setup messaging via Twilio
                >
                  Message Host
                </Button>
              </span>

              <div className="font-light max-w-[100%] mt-3 tracking-tight">
                {target?.description}
                {target?.attachments && target.attachments.length > 0 && (
                  <div className="h-full overflow-hidden">
                    <AttachmentSwiper attachments={target.attachments} />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        <span className="text-xs z-20 w-full text-primary tracking-tight font-extralight text-center mt-3">
          {formatDistanceToNow(timestamp, { addSuffix: true })}
        </span>
      </CardBody>
      <CardFooter className="flex gap-2 px-0 w-full z-30">
        <FeedCardFooter
          type={type}
          target={target}
          actor={actor}
          sourceId={
            (isUserActor(actor) && target?.status?.sourceId) ||
            target?.eventId?.toString() ||
            ""
          }
        />
      </CardFooter>
    </Card>
  );
}
