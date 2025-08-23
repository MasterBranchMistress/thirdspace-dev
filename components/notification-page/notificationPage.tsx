"use client";

import {
  Modal,
  ModalContent,
  Button,
  Accordion,
  AccordionItem,
  Avatar,
} from "@heroui/react";
import Image from "next/image";
import logo from "@/public/third-space-logos/thirdspace-logo-5.png";
import { useEffect, useState } from "react";
import ChevronLeftIcon from "@heroicons/react/24/outline/ChevronLeftIcon";
import { TitleWithCount } from "./title-with-label";
import { useSession } from "next-auth/react";
import Lottie from "lottie-react";
import emptynotifs from "@/public/lottie/emptynotifs.json";
import emptygroupnotifs from "@/public/lottie/emptygroupnotifs.json";
import emptymessagenotifs from "@/public/lottie/emptymessagenotifs.json";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { useNotifications } from "@/app/context/NotificationContext";

type NotificationsModalProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export type Notification = {
  _id: string;
  avatar: string;
  actorId: string;
  eventId: string;
  message: string;
  read?: boolean;
  type?: string;
  timestamp?: string;
};

export default function NotificationsModal({
  isOpen,
  onOpenChange,
}: NotificationsModalProps) {
  const [messages, setMessages] = useState([]);
  const [groupNotifications, setGroupNotifications] = useState([]);
  const { data: session } = useSession();
  const userId = session?.user.id;
  const regularDismissableNotifType = (type: string) => {
    if (
      type === "accepted_friend_request" ||
      type === "canceled" ||
      type === "removed" ||
      type === "user_left_event" ||
      type === "blocked_user_joined_event"
    ) {
      return true;
    }
    return false;
  };
  const shouldShowAvatar = (type: string) => {
    if (
      type === "accepted_friend_request" ||
      type === "blocked_user_joined_event"
    ) {
      return true;
    }
    return false;
  };
  const shouldShowEventIcon = (type: string) => {
    if (
      type === "canceled" ||
      type === "removed" ||
      type === "updated" ||
      type === "user_left_event" ||
      type === "received_friend_request"
    ) {
      return true;
    }
    return false;
  };

  //TODO: make context handlers for groups and messages
  const messagesCount = messages.length;
  const groupsCount = groupNotifications.length;
  const {
    notifications,
    loading,
    error,
    accept,
    reject,
    notificationCount,
    clearNotification,
    clearAll,
    refresh,
  } = useNotifications();

  useEffect(() => {
    console.log(`Notifications: ${notifications}`);
  }, [userId, messagesCount, notificationCount, groupsCount]);

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement="center"
      size="xs"
      isDismissable
      scrollBehavior="inside"
      backdrop="blur"
      className="bg-transparent text-concrete h-auto"
    >
      <ModalContent>
        {(onClose) => (
          <div className="flex flex-col">
            {/* {loading && (
              <div className="flex flex-1 items-center justify-center">
                <Spinner variant="dots" color="secondary" />
              </div>
            )} */}
            {
              <Image
                src={logo}
                width={600}
                alt="thirdspace-logo-white"
                className="justify-center p-0 animate-appearance-in pointer-events-none"
                style={{ marginTop: "-7rem", zIndex: 0 }}
              />
            }

            {/* Error State */}
            {error && (
              <div className="flex-1 flex items-center justify-center text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Content Area */}
            {
              <div
                className="flex-1 overflow-y-auto z-20"
                style={{ marginTop: "-7rem" }}
              >
                <Accordion
                  variant="light"
                  selectionMode="single"
                  defaultExpandedKeys={[]}
                  className="rounded-lg z-100"
                  isCompact={true}
                >
                  <AccordionItem
                    key="notifications"
                    aria-label="Notifications"
                    title={
                      <TitleWithCount
                        label="Notifications"
                        count={notificationCount}
                      />
                    }
                    indicator={
                      <ChevronLeftIcon
                        width={20}
                        color="primary"
                        className="text-white"
                      />
                    }
                  >
                    <div className="max-h-48 overflow-y-scroll animate-appearance-in">
                      <div className="w-full flex flex-col items-center text-center">
                        {notifications.length === 0 && (
                          <div className="mb-2 flex flex-col items-center justify-center">
                            <Lottie
                              animationData={emptynotifs}
                              style={{ width: "8rem", marginTop: "-2rem" }}
                            />
                            <h2 className="tracking-tight text-sm font-extralight">
                              All caught up here!
                            </h2>
                          </div>
                        )}

                        {notifications.map((n, index) => (
                          <div
                            key={`${n.eventId}-${index}`}
                            className="flex flex-row items-center gap-2 mb-4 justify-between w-full"
                          >
                            {shouldShowAvatar(n.type) && (
                              <Avatar
                                src={n.avatar}
                                alt="user-avatar"
                                size="md"
                                radius="full"
                                className="border-white border-1"
                              />
                            )}
                            {shouldShowEventIcon(n.type) && (
                              <button className="bg-primary shadow-2xs rounded-md p-1 px-1.5 text-xs font-extralight">
                                View
                              </button>
                            )}
                            <p
                              className={`text-xs tracking-tighter font-extralight text-center ${shouldShowAvatar(n.type) ? `w-[70%]` : `w-[100%]`}`}
                            >
                              {n.message}
                            </p>
                            {regularDismissableNotifType(n.type) && (
                              <button
                                onClick={() => {
                                  console.log(n._id);
                                  clearNotification(n._id.toString());
                                }}
                                className="rounded-full bg-white/10 backdrop-blur-lg border border-white/30 shadow-md hover:bg-white/20"
                              >
                                <XCircleIcon
                                  width={23}
                                  className="text-white"
                                />
                              </button>
                            )}
                            {n.type === "updated" && (
                              <div className="flex flex-row gap-1.5 ml-3">
                                <button
                                  onClick={() => {
                                    clearNotification(n._id.toString());
                                  }}
                                  className="rounded-full bg-white/10 backdrop-blur-lg border border-white/30 shadow-md hover:bg-white/20"
                                >
                                  <XCircleIcon
                                    width={23}
                                    className="text-white"
                                  />
                                </button>
                              </div>
                            )}
                            {n.type === "received_friend_request" && (
                              <div className="text-white flex flew-row gap-1">
                                <button
                                  onClick={() => {
                                    accept(n.actorId);
                                  }}
                                >
                                  <CheckCircleIcon
                                    width={23}
                                    className="text-concrete bg-primary rounded-full"
                                  />
                                </button>
                                <button
                                  onClick={() => {
                                    reject(n.actorId);
                                  }}
                                  className="rounded-full bg-white/10 backdrop-blur-lg border border-white/30 shadow-md hover:bg-white/20"
                                >
                                  <XCircleIcon
                                    width={23}
                                    className="text-white"
                                  />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                        <div className="flex gap-3 justify-center my-2">
                          <Button
                            size="sm"
                            hidden={!notificationCount}
                            variant="shadow"
                            color="primary"
                            onPress={async () => {
                              try {
                                await clearAll();
                              } catch (e) {
                                console.error(e);
                              }
                            }}
                          >
                            Clear All
                          </Button>
                        </div>
                      </div>
                    </div>
                  </AccordionItem>
                  <AccordionItem
                    key="messages"
                    aria-label="Messages"
                    title={
                      <TitleWithCount label="Messages" count={messagesCount} />
                    }
                    indicator={
                      <ChevronLeftIcon
                        width={20}
                        color="primary"
                        className="text-white"
                      />
                    }
                  >
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                      <div className="w-full flex flex-col items-center text-center">
                        {messages.length === 0 && (
                          <div className="mb-2 flex flex-col items-center justify-center">
                            <Lottie
                              animationData={emptymessagenotifs}
                              style={{ width: "8rem" }}
                            />
                            <h2 className="tracking-tight text-sm font-extralight">
                              No messages yet!
                            </h2>
                          </div>
                        )}
                        {/* TODO: map messages here */}
                      </div>
                    </div>
                  </AccordionItem>
                  <AccordionItem
                    key="groups"
                    aria-label="Groups"
                    title={
                      <TitleWithCount label="Groups" count={groupsCount} />
                    }
                    indicator={
                      <ChevronLeftIcon
                        width={20}
                        color="primary"
                        className="text-white"
                      />
                    }
                  >
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                      <div className="w-full px-3 flex flex-col items-center text-center">
                        {groupNotifications.length === 0 && (
                          <div className="mb-2 flex flex-col items-center justify-center">
                            <Lottie
                              animationData={emptygroupnotifs}
                              style={{ width: "8rem", marginTop: "-1rem" }}
                            />
                            <h2 className="tracking-tight text-sm font-extralight">
                              Nothing new here!
                            </h2>
                          </div>
                        )}
                        {/* TODO: map messages here */}
                      </div>
                    </div>
                  </AccordionItem>
                </Accordion>
              </div>
            }

            {/* Footer Actions */}
            {/* {!loading && (
              <div className="flex gap-3 justify-center my-4">
                <Button
                  size="sm"
                  variant="shadow"
                  color="primary"
                  onPress={() => {
                    // bulk mark-as-read here
                  }}
                >
                  Mark All Read
                </Button>
                <Button
                  size="sm"
                  variant="bordered"
                  color="secondary"
                  onPress={onClose}
                >
                  Close
                </Button>
              </div>
            )} */}
          </div>
        )}
      </ModalContent>
    </Modal>
  );
}
