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
import fire from "@/public/lottie/fire.json";
import { FeedEventActor, FeedItem, FeedUserActor } from "@/types/user-feed";
import {
  ArrowPathRoundedSquareIcon,
  ArrowRightStartOnRectangleIcon,
  EllipsisVerticalIcon,
  FlagIcon,
  TrashIcon,
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
import { useToast } from "@/app/providers/ToastProvider";
import {
  sparkEvent,
  unsparkEvent,
} from "@/utils/feed-item-actions/event-item-actions/sparkHandler";
import {
  getStatusSparks,
  sparkStatus,
  unsparkStatus,
} from "@/utils/feed-item-actions/status-item-actions/sparkHandler";
import SparkMeta from "./FeedStats";
import StatusDetailModal from "../status-view-modal/statusViewModal";

export default function FeedItemCard({ item }: FeedItemCardProps) {
  const { data: session } = useSession();
  const user = session?.user;
  const [avatarUrl, setAvatarUrl] = useState<string>();
  const [showPulse, setShowPulse] = useState(false);
  const [hasSparked, setHasSparked] = useState(false);
  const [previewFriends, setPreviewFriends] = useState([]);
  const [openStatusId, setOpenStatusId] = useState<string | null>(null);
  const { type, target, actor, timestamp } = item;
  const { notify } = useToast();
  const openStatus = (id?: string) => {
    if (!id) return;
    setOpenStatusId(id);
  };
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

  // console.log(actor); //for debugging

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

  useEffect(() => {
    setHasSparked(Boolean((item as any).hasSparked));
    setPreviewFriends((item as any).friendSparkPreviewUsers ?? []);
  }, [(item as any).hasSparked]);

  const buttonText = isUserActor(actor) ? (
    <Lottie animationData={sendmessage} style={{ width: "1.6rem" }} />
  ) : null;
  const router = useRouter();
  const relationship = isUserActor(actor)
    ? getRelationship(String(actor.id))
    : getRelationship(String(target?.userId));

  const isSelf = isUserActor(actor)
    ? String(user?.id) === String(actor.id)
    : String(user?.id) === String(target?.userId);

  const message =
    type === "event_is_popular"
      ? `${target?.title} by ${actor.firstName} is trending 🔥`
      : type === "event_coming_up"
        ? `"${target?.title}" is coming up ⏰`
        : type === "profile_avatar_updated" && isUserActor(actor)
          ? `${actor.firstName} updated their look 😎`
          : type === "hosted_event"
            ? ""
            : type === "joined_platform" && isUserActor(actor)
              ? `Welcome aboard ${actor.firstName}! There's much to do 🚀`
              : type === "profile_location_updated" && isUserActor(actor)
                ? `${actor.firstName} moved somewhere new 📍`
                : type === "profile_bio_updated" && isUserActor(actor)
                  ? `${actor.firstName} updated their bio 🖊️`
                  : type === "profile_status_updated" && isUserActor(actor)
                    ? ``
                    : isUserActor(actor) &&
                      `${actor.firstName} is doing something cool 🤔`;

  const handleEventSpark = async (eventId?: string) => {
    if (!eventId || !user) return;
    const next = !hasSparked; // toggle
    const prev = hasSparked;

    try {
      setHasSparked(next); // optimistic
      if (next) {
        await sparkEvent({ loggedInUser: user, eventId });
        setShowPulse(true);
        setTimeout(() => setShowPulse(false), 2000);
      } else {
        await unsparkEvent({ loggedInUser: user, eventId });
        notify(
          `Removed Spark from ${actor.firstName}'s event 🙅`,
          `${target?.title} 🗓️`,
        );
      }
    } catch (err) {
      setHasSparked(false); // rollback
      console.error(err);
      notify("Something went wrong", "");
    }
  };

  const handleStatusSpark = async (statusId?: string) => {
    if (!statusId || !user) return;

    const next = !hasSparked; // toggle
    const prev = hasSparked;

    try {
      setHasSparked(next); // optimistic

      if (next) {
        await sparkStatus({ loggedInUser: user, statusId });
        setShowPulse(true);
        setTimeout(() => setShowPulse(false), 2000);
      } else {
        await unsparkStatus({ loggedInUser: user, statusId });
      }
    } catch (err) {
      setHasSparked(prev); // rollback
      console.error(err);
      notify("Something went wrong", "");
    }
  };

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
              Show Me Around ✨
            </Button>
          )}

          {type === "profile_status_updated" && isUserActor(actor) && (
            <div className="font-light tracking-tight max-w-[100%] text-center">
              <p className="mx-1.5 text-sm mb-2">{target?.status?.content}</p>
              {target?.status?.attachments &&
                target.status.attachments.length > 0 && (
                  <div className="h-full">
                    <AttachmentSwiper
                      controls={false}
                      hidePlayButton={false}
                      muted={true}
                      statusId={target.status?.sourceId}
                      onOpenStatus={() => openStatus(target.status?.sourceId)} // whatever your modal state setter is
                      attachments={target.status.attachments}
                      onDoubleTap={() =>
                        handleStatusSpark(target.status?.sourceId)
                      }
                    />
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
                <div className="font-light tracking-tight text-sm px-3 my-3">
                  {target?.snippet}
                </div>
              </div>
              {target?.attachments && target.attachments.length > 0 && (
                <div
                  className="relative h-full overflow-hidden"
                  onClick={() =>
                    router.push(`/dashboard/event/${actor.eventId}`)
                  }
                >
                  {/* Media */}
                  <AttachmentSwiper
                    attachments={target.attachments}
                    muted={true}
                    controls={true}
                    hidePlayButton={true}
                  />
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
              <div className="py-1 mb-3">{target?.description}</div>
              {target?.attachments && target.attachments.length > 0 && (
                <div
                  className="h-full overflow-hidden"
                  onClick={() =>
                    router.push(`/dashboard/event/${actor.eventId}`)
                  }
                >
                  <AttachmentSwiper
                    muted={true}
                    controls={true}
                    attachments={target.attachments}
                  />
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

              <div
                className="font-light max-w-[100%] mt-3 tracking-tight"
                onClick={() => router.push(`/dashboard/event/${actor.eventId}`)}
              >
                <div className="px-3 mb-2"> {target?.description}</div>
                {target?.attachments && target.attachments.length > 0 && (
                  <div className="h-full overflow-hidden">
                    <AttachmentSwiper
                      muted={true}
                      controls={true}
                      attachments={target.attachments}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        <span className="text-xs z-20 w-full text-primary tracking-tight font-extralight text-center mt-3">
          {formatDistanceToNow(timestamp, { addSuffix: true })}
        </span>
        {openStatusId && (
          <StatusDetailModal
            isImage
            statusId={openStatusId}
            hasSparked={hasSparked}
            onClose={() => setOpenStatusId(null)}
            onSparkStatus={handleStatusSpark}
          />
        )}
      </CardBody>
      {/* Contemplating removing this componant altogether. Makes the feed look cleaner. Thean stats can show on-click */}
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
          userId={target?.userId?.toString()}
          hasSparked={hasSparked}
          friendPreviewUsers={previewFriends}
        />
      </CardFooter>
    </Card>
  );
}
