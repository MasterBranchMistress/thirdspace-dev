"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Avatar,
} from "@heroui/react";
import logo from "@/public/third-space-logos/thirdspace-logo-5.png";
import Image from "next/image";
import { SessionUser } from "@/types/user-session";
import { UserDoc } from "@/lib/models/User";
import { useEffect, useState } from "react";
import { getUserFriends } from "@/utils/frontend-backend-connection/getUserFriendList";
import { ChatBubbleLeftIcon } from "@heroicons/react/24/outline";
import {
  ChatBubbleLeftRightIcon,
  MegaphoneIcon,
} from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";
import { ObjectId } from "mongodb";
import Lottie from "lottie-react";
import emptyFriends from "@/public/lottie/emptymessagenotifs.json";
import { useToast } from "@/app/providers/ToastProvider";
import hourglass from "@/public/lottie/hourglass.json";

type FriendsModalProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  user: SessionUser;
};

type FriendPreview = {
  avatar: string;
  firstName: string;
  lastName: string;
  username: string;
  _id: ObjectId;
};

export default function FriendsModal({
  isOpen,
  onOpenChange,
  user,
}: FriendsModalProps) {
  if (!user) return "No user found";
  const [loading, setLoading] = useState(false);
  const { notify } = useToast();
  const [friends, setFriends] = useState<FriendPreview[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (!isOpen || !user) return;

    let isMounted = true;

    const fetchFriends = async () => {
      setLoading(true);
      try {
        const data = await getUserFriends(user);
        if (isMounted) {
          setFriends(data.friends);
        }
      } catch (err) {
        setFriends([]);
        console.error("Failed to fetch friends", err);
        return notify(
          "something went wrong here 🤔",
          "Unable to get friends list",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();

    return () => {
      isMounted = false;
    };
  }, [isOpen, user]);

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="xs"
      backdrop="blur"
      placement="center"
      classNames={{ closeButton: "text-secondary" }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            {!loading && (
              <Image
                src={logo}
                width={600}
                alt="thirdspace-logo-white"
                className="justify-center p-0"
                style={{ marginTop: "-6rem" }}
              />
            )}

            <ModalBody>
              {loading ? (
                // 🔄 LOADING STATE
                <div className="flex flex-col justify-center items-center py-6">
                  <Lottie
                    animationData={hourglass}
                    style={{ width: "12rem" }}
                  />
                  <h1>Calling your Astros..</h1>
                </div>
              ) : (
                // ✅ NORMAL CONTENT
                <div className="flex flex-col gap-3 mt-[-7rem] h-auto overflow-y-auto">
                  {Array.isArray(friends) && friends.length ? (
                    friends.map((user: FriendPreview) => (
                      <div
                        key={user._id?.toString()}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-default-100 transition"
                        onClick={() =>
                          router.push(`/dashboard/profile/${String(user._id)}`)
                        }
                      >
                        <Avatar
                          size="md"
                          isBordered
                          src={user.avatar}
                          alt={user.firstName}
                          className="w-10 h-10 rounded-full object-cover shrink-0"
                        />

                        <div className="flex flex-row w-full justify-between">
                          <div className="flex flex-col truncate max-w-[10rem]">
                            <div className="flex flex-row gap-1">
                              <span className="text-sm font-light">
                                {user.firstName}
                              </span>
                              <span className="text-sm font-medium">
                                {user.lastName}
                              </span>
                            </div>
                            <span className="text-xs text-default-500">
                              @{user.username}
                            </span>
                          </div>
                          <div className="flex flex-row gap-1">
                            <ChatBubbleLeftRightIcon
                              width={20}
                              color="secondary"
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center mt-[-1.5rem] gap-2 py-6">
                      <Lottie
                        animationData={emptyFriends}
                        loop
                        style={{ width: 120, height: 120 }}
                      />
                      <p className="text-sm mt-3 text-default-500 text-center">
                        Your orbit is empty… for now 🌌
                      </p>
                    </div>
                  )}
                </div>
              )}
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
