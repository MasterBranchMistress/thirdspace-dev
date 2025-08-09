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
import React from "react";
import FeedCardFooter from "./FeedCardFooter";
import { useRouter } from "next/navigation";
import { FeedEventActor, FeedItem, FeedUserActor } from "@/types/user-feed";
import {
  EllipsisVerticalIcon,
  ExclamationCircleIcon,
  EyeSlashIcon,
  FlagIcon,
  UserMinusIcon,
} from "@heroicons/react/24/outline";
import AttachmentSwiper from "../swiper/swiper";
import detectMediaType from "@/utils/detect-media-type/detectMediaType";
// import { FEED_BUTTON_DROPDOWN_OPTIONS } from "@/lib/constants";

interface FeedItemCardProps {
  item: FeedItem;
}

export default function FeedItemCard({ item }: FeedItemCardProps) {
  const { type, target, actor, timestamp } = item;

  const isUserActor = (
    a: FeedUserActor | FeedEventActor | null | undefined
  ): a is FeedUserActor => {
    return !!a && typeof (a as any).id === "string";
  };

  const items = [
    {
      key: "report",
      label: "Report",
    },
    {
      key: "hide",
      label: "Hide",
    },
    {
      key: "block",
      label: "Block User",
    },
  ];

  const title = target?.snippet || "an event";

  const message =
    type === "event_is_popular"
      ? `"${target?.title}" is trending 🔥`
      : type === "event_coming_up" && !isUserActor(actor)
        ? `"${target?.title}" is coming up ⏰`
        : type === "hosted_event" && isUserActor(actor)
          ? `${actor.firstName} is hosting "${target?.snippet}"`
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
            <div className="flex flex-col gap-1 items-center justify-center">
              <h6 className="text-small font-semibold justify-center tracking-tight leading-none text-primary">
                {target?.host ?? target?.hostName}'s event has an Update!
              </h6>
              <h5 className="text-small font-light tracking-tight text-primary">
                Starts{" "}
                {target?.startingDate
                  ? format(new Date(target?.startingDate), "PPP p")
                  : "TBD"}
              </h5>
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
        <Dropdown>
          <DropdownTrigger>
            <EllipsisVerticalIcon color="primary" width={30} />
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
      </CardHeader>
      <CardBody className="px-3 py-0 text-small text-center tracking-tight font-light">
        <p className="font-bold text-center tracking-tight mt-2">{message}</p>
        <div className="flex flex-col justify-center items-center">
          {type === "profile_bio_updated" && target?.snippet && (
            <span className="font-light mt-2 max-w-[50%]">
              {target.snippet}
            </span>
          )}
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
                <div className="font-bold pb-1">
                  {target?.host} is hosting {target?.title}!
                </div>
                <div className="tracking-tight text-sm">{target?.snippet}</div>
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
