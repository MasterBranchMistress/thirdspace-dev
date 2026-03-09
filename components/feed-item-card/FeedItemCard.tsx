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
  Textarea,
} from "@heroui/react";

import Image from "next/image";

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
  BookmarkSlashIcon,
  ChatBubbleBottomCenterIcon,
  ChatBubbleLeftEllipsisIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  FireIcon,
  PaperAirplaneIcon,
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
import { deleteStatus } from "@/utils/feed-item-actions/status-item-actions/deleteStatus";
import { NearbyUserCard } from "../discoverability/nearbyUserCard";
import { UserDoc } from "@/lib/models/User";
import { Swiper, SwiperSlide } from "swiper/react";
import {
  A11y,
  EffectCards,
  EffectCoverflow,
  EffectFade,
  Navigation,
  Pagination,
  Scrollbar,
} from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/scrollbar";
import "swiper/css/effect-fade";
import { EventDiscoverabilityCard } from "../discoverability/nearbyEventCard";
import { EventDoc } from "@/lib/models/Event";
import FeedAttachmentSwiper from "../discoverability/feedCard";
import WelcomeBanner from "../welcome-banner/welcomeBanner";
import MissionChecklist from "../welcome-banner/checklist/checklist";
import { getUser } from "@/utils/frontend-backend-connection/getUserInfo";
import { useFeed } from "@/app/context/UserFeedContext";
import { useAvatar, useUsername } from "@/app/context/UserContext";
import RankBadge from "../karma/rankBadge";

export default function FeedItemCard({ item }: FeedItemCardProps) {
  const { data: session } = useSession();
  const user = session?.user;
  const { avatar } = useAvatar();
  const { username } = useUsername();
  if (!user) return;
  const [showPulse, setShowPulse] = useState(false);
  const [hasSparked, setHasSparked] = useState(false);
  const [previewFriends, setPreviewFriends] = useState([]);
  const [openStatusId, setOpenStatusId] = useState<string | null>(null);
  const [activeEventIndex, setActiveEventIndex] = useState(0); //For discover events section
  const [activeUserIndex, setActiveUserIndex] = useState(0); // for discover users section
  const [statusJustPosted, setStatusJustPosted] = useState(false);
  const [visibility, setVisibility] = useState(false);
  const [tags, setTags] = useState(false);
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const { type, target, actor, timestamp } = item;
  const { notify } = useToast();
  const feed = useFeed();

  const openStatus = (id?: string) => {
    if (!id) return;
    setOpenStatusId(id);
  };

  const isUserActor = (
    a: FeedUserActor | FeedEventActor | null | undefined,
  ): a is FeedUserActor => {
    return !!a && typeof (a as any).id === "string";
  };

  const isCurrentUser =
    (isUserActor(actor) && String(actor.id) === String(session?.user?.id)) ||
    (!isUserActor(actor) && String(target?.userId) === String(session.user.id));

  // console.log("Quality Badges: ", isUserActor(actor) && actor);

  const avatarUrl = isUserActor(actor)
    ? isCurrentUser
      ? avatar || actor.avatar || getGravatarUrl(actor.email ?? "")
      : actor.avatar || getGravatarUrl(actor.email ?? "")
    : actor?.avatar || "/misc/party.jpg";

  const actorUsername = !actor
    ? username
    : isUserActor(actor)
      ? isCurrentUser
        ? username
        : actor.username
      : username;

  const { getRelationship } = useUserRelationships();

  const loadUserDoc = async () => {
    const res = await getUser(user);
    setUserDoc(res.user);
  };

  useEffect(() => {
    const loadUser = async () => {
      const res = await getUser(user);
      setUserDoc(res.user);
    };

    loadUser();
  }, [user]);

  const handleStatusPosted = async () => {
    localStorage.setItem("feedTutorialComplete", "true");
    setStatusJustPosted(true);
    await loadUserDoc();
  };

  const handleVisibilitySet = async () => {
    setVisibility(true);
    await loadUserDoc();
  };

  const handleSetTags = async () => {
    setTags(true);
    await loadUserDoc();
  };

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
      ? `Orbit Breaker™ 🔥`
      : type === "event_coming_up"
        ? `Touching Down™  ⏰`
        : type === "hosted_event"
          ? ""
          : type === "joined_platform" && isUserActor(actor)
            ? ``
            : type === "profile_bio_updated" && isUserActor(actor)
              ? `${actor.firstName} updated their bio 🖊️`
              : type === "profile_status_updated" && isUserActor(actor)
                ? ``
                : type === "discover_events"
                  ? `The Solar System ™   ☄️`
                  : type === "discover_users"
                    ? `The Space Station ™ 👽`
                    : isUserActor(actor) &&
                      `${actor.firstName} is doing something cool 🤔`;

  const handleDeletePost = async (statusId?: string) => {
    try {
      if (!statusId) return;
      await deleteStatus(statusId);
      setOpenStatusId(null);
      notify("Your post has been deleted ❌", "");
      feed.removeItemByStatusId(statusId);
    } catch (e) {
      return e as Error;
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

  // console.log("RANK DEBUG", {
  //   type,
  //   isUserActor: isUserActor(actor),
  //   actor,
  //   actorQualityBadge: isUserActor(actor)
  //     ? actor.qualityBadge
  //     : target?.qualityBadge,
  //   targetQualityBadge: target?.qualityBadge,
  //   badgePassedToComponent: isUserActor(actor)
  //     ? actor.qualityBadge
  //     : target?.qualityBadge,
  // });

  return (
    <Card
      radius="none"
      className="w-full shadow-none text-primary bg-concrete mb-7"
    >
      {actor && (
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
                src={avatarUrl}
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
  truncate max-w-[12rem]"
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
                    @{actorUsername}
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
            <RankBadge
              rank={
                isUserActor(actor) ? actor.qualityBadge : target?.qualityBadge
              }
              size="sm"
            />
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
                    onClick={() => handleDeletePost(target?.status?.sourceId)}
                  >
                    Delete Post
                  </DropdownItem>
                ) : null}
              </DropdownMenu>
            </Dropdown>
          </div>
        </CardHeader>
      )}

      <CardBody className="px-0 py-0 text-small text-center tracking-tight font-light">
        <p className="font-bold text-center tracking-tighter">{message}</p>
        <div className="flex flex-col justify-center items-center">
          {type === "profile_bio_updated" && target?.snippet && (
            <span className="font-light mx-2 my-2 max-w-[100%]">
              {target.snippet}
            </span>
          )}
          {type === "joined_platform" && isUserActor(actor) && (
            <div className="font-light tracking-tight w-[100vw] text-center">
              <WelcomeBanner firstName={target?.firstName ?? "Explorer"} />
              {userDoc && (
                <MissionChecklist
                  handleStatusPosted={handleStatusPosted}
                  visibilityWasSet={visibility}
                  handleVisibilitySet={handleVisibilitySet}
                  sessionUser={userDoc}
                  refreshUserdoc={loadUserDoc}
                  statusJustPosted={statusJustPosted}
                  handleSetTags={handleSetTags}
                  tagsWereSet={tags}
                />
              )}

              {/* Attachments */}
              {target?.attachments?.length ? (
                <Swiper
                  effect={"cards"}
                  grabCursor={true}
                  centeredSlides={true}
                  slidesPerView={"auto"}
                  pagination={true}
                  modules={[EffectCards]}
                  className="flex justify-center mt-3"
                  cardsEffect={{ slideShadows: false }}
                >
                  {target.attachments?.map((a, i) => {
                    return (
                      <SwiperSlide
                        key={i}
                        className={`${target.attachments?.length && target.attachments?.length > 1 ? `!w-[85vw]` : `h-auto`} flex justify-center`}
                      >
                        <FeedAttachmentSwiper
                          attachments={target.attachments}
                          attachment={a as any}
                          controls={true}
                          muted={true}
                        />
                      </SwiperSlide>
                    );
                  })}
                </Swiper>
              ) : null}
            </div>
          )}
          {item.type === "discover_users" && (item as any).data?.users && (
            <>
              <Swiper
                effect={"cards"}
                grabCursor={true}
                centeredSlides={true}
                slidesPerView={"auto"}
                pagination={true}
                modules={[EffectCards]}
                className="flex justify-center mt-3"
                cardsEffect={{
                  slideShadows: false,
                }}
                onSlideChange={(swiper) => setActiveUserIndex(swiper.realIndex)}
                onTap={() => {
                  const activeUser = (item as any).data.users[activeUserIndex];
                  if (!activeUser?.id) return;
                  router.push(`/dashboard/profile/${String(activeUser.id)}`);
                }}
              >
                {(item as any).data.users.map((u: UserDoc, index: number) => (
                  <SwiperSlide
                    key={String(u._id) + index.toString()}
                    className="!w-[85vw] flex justify-center"
                  >
                    <NearbyUserCard user={u} />
                  </SwiperSlide>
                ))}
              </Swiper>
            </>
          )}

          {type === "discover_events" && (
            <>
              <Swiper
                effect={"cards"}
                grabCursor={true}
                centeredSlides={true}
                slidesPerView={"auto"}
                pagination={true}
                modules={[EffectCards]}
                className="flex justify-center mt-3"
                cardsEffect={{ slideShadows: false }}
                preventClicks={false}
                preventClicksPropagation={false}
                onSlideChange={(swiper) =>
                  setActiveEventIndex(swiper.realIndex)
                }
                onTap={() => {
                  const activeEvent = (item as any).data.events[
                    activeEventIndex
                  ];
                  if (!activeEvent?._id) return;
                  router.push(`/dashboard/event/${String(activeEvent._id)}`);
                }}
              >
                {(item as any).data.events.map((e: EventDoc, index: number) => (
                  <>
                    <SwiperSlide
                      key={String(e._id) + index.toString}
                      className="!w-[85vw] flex justify-center"
                    >
                      <EventDiscoverabilityCard event={e} />
                    </SwiperSlide>
                  </>
                ))}
              </Swiper>
            </>
          )}

          {type === "profile_status_updated" && isUserActor(actor) && (
            <div className="font-light tracking-tight max-w-[100%] text-center">
              {/* Text */}
              {target?.status?.content?.trim() ? (
                <p className="mx-3 text-sm my-2">{target.status.content}</p>
              ) : null}

              {/* Attachments */}
              {target?.status?.attachments?.length ? (
                <Swiper
                  effect={"cards"}
                  grabCursor={true}
                  centeredSlides={true}
                  slidesPerView={"auto"}
                  pagination={true}
                  modules={[EffectCards]}
                  className="flex justify-center mt-3"
                  cardsEffect={{ slideShadows: false }}
                  onTap={() => {
                    const activeStatusId = target.status?.sourceId;
                    if (!activeStatusId) return;
                    openStatus(activeStatusId);
                  }}
                >
                  {target.status.attachments?.map((a, i) => {
                    return (
                      <SwiperSlide
                        key={i}
                        className={`${target.status?.attachments?.length && target.status?.attachments?.length > 1 ? `!w-[85vw]` : `h-auto`} flex justify-center`}
                      >
                        <FeedAttachmentSwiper
                          statusId={target.status?.sourceId}
                          attachments={target.status?.attachments}
                          attachment={a as any}
                          controls={true}
                          muted={true}
                        />
                      </SwiperSlide>
                    );
                  })}
                </Swiper>
              ) : null}

              {/* Actions (ALWAYS render if the status exists) */}
              {target?.status?.attachments.length === 0 ? (
                <div className="mt-3 flex justify-center gap-3 py-1">
                  <button
                    type="button"
                    className="text-sm opacity-80 hover:opacity-100"
                    onClick={() => openStatus(target.status!.sourceId)}
                  >
                    <ChatBubbleLeftEllipsisIcon
                      width={25}
                      className="text-primary"
                    />
                  </button>
                  <button
                    type="button"
                    className="text-sm opacity-80 hover:opacity-100"
                    onClick={() => openStatus(target.status!.sourceId)}
                  >
                    <FireIcon width={25} className="text-primary" />
                  </button>
                  <button
                    type="button"
                    className="text-sm opacity-80 hover:opacity-100"
                    onClick={() => openStatus(target.status!.sourceId)}
                  >
                    <ArrowPathRoundedSquareIcon
                      width={25}
                      className="text-primary"
                    />
                  </button>
                  <button
                    type="button"
                    className="text-sm opacity-80 hover:opacity-100"
                    onClick={() => openStatus(target.status!.sourceId)}
                  >
                    <PaperAirplaneIcon width={25} className="text-primary" />
                  </button>
                  {/* later: Spark / Share / Repost */}
                </div>
              ) : null}
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
                <div className="font-light tracking-tight text-md px-3 mt-3">
                  {target?.snippet}
                </div>
              </div>
              {target?.attachments && target.attachments.length > 0 ? (
                <div
                  className="relative overflow-hidden"
                  onClick={() =>
                    router.push(`/dashboard/event/${String(actor.eventId)}`)
                  }
                >
                  <Swiper
                    effect={"cards"}
                    grabCursor={true}
                    centeredSlides={true}
                    slidesPerView={"auto"}
                    pagination={true}
                    modules={[EffectCards]}
                    className="flex justify-center mt-3"
                    cardsEffect={{ slideShadows: false }}
                    onClick={() =>
                      router.push(`/dashboard/event/${actor.eventId}`)
                    }
                  >
                    {target.attachments.map((a, i) => {
                      return (
                        <SwiperSlide
                          key={i}
                          className={`flex ${target.attachments?.length && target.attachments?.length > 1 ? `!w-[85vw]` : `h-auto`} justify-center`}
                        >
                          <FeedAttachmentSwiper
                            key={i}
                            attachment={a as any}
                            attachments={target.attachments}
                          />
                        </SwiperSlide>
                      );
                    })}
                  </Swiper>
                </div>
              ) : (
                <div
                  className="relative w-[100vw] h-[60vh] overflow-hidden mt-3 cursor-pointer"
                  onClick={() =>
                    router.push(`/dashboard/event/${actor.eventId}`)
                  }
                >
                  <Image
                    src={"/third-space-logos/thirdspace-logo-6.png"}
                    alt={`thirdspace-logo`}
                    fill
                    priority
                    className="relative z-10 object-cover"
                  />
                </div>
              )}
            </div>
          )}
          {type === "event_is_popular" && (
            <div className="font-light max-w-[100%] mt-2 tracking-tight">
              <div className="flex flex-row font-bold text-sm text-center justify-center mb-2 items-center">
                <span className="font-semibold shadow-lg shadow-primary border-1 border-primary py-1 mr-[-12] px-3 rounded-l-lg">
                  {actor.firstName} is hosting
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
              <div className="py-1 my-3">{target?.description}</div>
              {target?.attachments && target.attachments.length > 0 && (
                <div
                  className="relative overflow-hidden"
                  onClick={() =>
                    router.push(`/dashboard/event/${String(actor.eventId)}`)
                  }
                >
                  <Swiper
                    effect={"cards"}
                    grabCursor={true}
                    centeredSlides={true}
                    slidesPerView={"auto"}
                    pagination={true}
                    modules={[EffectCards]}
                    className="flex justify-center"
                    cardsEffect={{ slideShadows: false }}
                    onClick={() =>
                      router.push(`/dashboard/event/${actor.eventId}`)
                    }
                  >
                    {target?.attachments && target.attachments.length > 0 ? (
                      <div
                        className="relative overflow-hidden"
                        onClick={() =>
                          router.push(
                            `/dashboard/event/${String(actor.eventId)}`,
                          )
                        }
                      >
                        <Swiper
                          effect={"cards"}
                          grabCursor={true}
                          centeredSlides={true}
                          slidesPerView={"auto"}
                          pagination={true}
                          modules={[EffectCards]}
                          className="flex justify-center mt-3"
                          cardsEffect={{ slideShadows: false }}
                          onClick={() =>
                            router.push(`/dashboard/event/${actor.eventId}`)
                          }
                        >
                          {target.attachments.map((a, i) => {
                            return (
                              <SwiperSlide
                                key={i}
                                className={`flex ${target.attachments?.length && target.attachments?.length > 1 ? `!w-[85vw]` : `h-auto`} justify-center`}
                              >
                                <FeedAttachmentSwiper
                                  key={i}
                                  attachment={a as any}
                                  attachments={target.attachments}
                                />
                              </SwiperSlide>
                            );
                          })}
                        </Swiper>
                      </div>
                    ) : (
                      <div
                        className="relative w-[100vw] h-[60vh] overflow-hidden mt-3 cursor-pointer"
                        onClick={() =>
                          router.push(`/dashboard/event/${actor.eventId}`)
                        }
                      >
                        <Image
                          src={"/third-space-logos/thirdspace-logo-6.png"}
                          alt={`thirdspace-logo`}
                          fill
                          priority
                          className="relative z-10 object-cover"
                        />
                      </div>
                    )}
                  </Swiper>
                </div>
              )}
            </div>
          )}
          {type === "event_coming_up" && (
            <>
              <div
                className="font-light max-w-[100%] mt-3 tracking-tight"
                onClick={() => router.push(`/dashboard/event/${actor.eventId}`)}
              >
                <div className="w-full flex justify-center">
                  <div className="flex flex-row font-bold text-sm text-center mb-2 items-center">
                    <span className="font-semibold shadow-lg shadow-primary border-1 border-primary py-1 mr-[-12] px-3 rounded-l-lg">
                      {actor.firstName} is hosting
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
                </div>
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
                      <BookmarkSlashIcon
                        color="secondary"
                        width={20}
                        className="p-0 m-0"
                      />
                    }
                    size="sm"
                    variant="shadow"
                    color="danger"
                    className="text-secondary font-bold ml-3"
                    onPress={() => console.log("TODO: leave event api here!!")}
                  >
                    Cancel
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
                {target?.attachments && target.attachments.length > 0 ? (
                  <div
                    className="relative overflow-hidden"
                    onClick={() =>
                      router.push(`/dashboard/event/${String(actor.eventId)}`)
                    }
                  >
                    <Swiper
                      effect={"cards"}
                      grabCursor={true}
                      centeredSlides={true}
                      slidesPerView={"auto"}
                      pagination={true}
                      modules={[EffectCards]}
                      className="flex justify-center mt-3"
                      cardsEffect={{ slideShadows: false }}
                      onClick={() =>
                        router.push(`/dashboard/event/${actor.eventId}`)
                      }
                    >
                      {target.attachments.map((a, i) => {
                        return (
                          <SwiperSlide
                            key={i}
                            className={`flex ${target.attachments?.length && target.attachments?.length > 1 ? `!w-[85vw]` : `h-auto`} justify-center`}
                          >
                            <FeedAttachmentSwiper
                              key={i}
                              attachment={a as any}
                              attachments={target.attachments}
                            />
                          </SwiperSlide>
                        );
                      })}
                    </Swiper>
                  </div>
                ) : (
                  <div
                    className="relative w-[100vw] h-[60vh] overflow-hidden mt-3 cursor-pointer"
                    onClick={() =>
                      router.push(`/dashboard/event/${actor.eventId}`)
                    }
                  >
                    <Image
                      src={"/third-space-logos/thirdspace-logo-6.png"}
                      alt={`thirdspace-logo`}
                      fill
                      priority
                      className="relative z-10 object-cover"
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
            textOnly={!target?.status?.attachments.length}
            statusId={openStatusId}
            hasSparked={hasSparked}
            onClose={() => setOpenStatusId(null)}
            onSparkStatus={handleStatusSpark}
            onDeletePost={() => {
              const statusId = openStatusId;
              handleDeletePost(statusId);
            }}
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
