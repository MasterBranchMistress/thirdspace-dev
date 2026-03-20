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
import emptyFriends from "@/public/lottie/emptymessagenotifs.json"; // your file
import { getUserFollowers } from "@/utils/frontend-backend-connection/getUserFollowerList";

type FriendsModalProps = {
  isFollowersOpen: boolean;
  onFollowersOpenChange: (open: boolean) => void;
  userId: string;
};

type FollowerPreview = {
  avatar: string;
  firstName: string;
  lastName: string;
  username: string;
  _id: ObjectId;
};

export default function FollowersModal({
  isFollowersOpen,
  onFollowersOpenChange,
  userId,
}: FriendsModalProps) {
  const [followers, setFollowers] = useState<FollowerPreview[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (!isFollowersOpen) return;

    let isMounted = true;

    const fetchFollowers = async () => {
      try {
        const data = await getUserFollowers(userId);
        if (isMounted) {
          setFollowers(data.followers);
        }
      } catch (err) {
        console.error("Failed to fetch friends", err);
      }
    };

    fetchFollowers();

    return () => {
      isMounted = false;
    };
  }, [isFollowersOpen, userId]);

  return (
    <Modal
      isOpen={isFollowersOpen}
      onOpenChange={onFollowersOpenChange}
      size="xs"
      backdrop="blur"
      placement="center"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <Image
              src={logo}
              width={600}
              alt="thirdspace-logo-white"
              className="justify-center p-0"
              style={{ marginTop: "-6rem" }}
            ></Image>

            <ModalBody>
              {/* Placeholder content */}
              <div className="flex flex-col gap-3 mt-[-7rem] h-auto overflow-y-auto">
                {Array.isArray(followers) && followers.length ? (
                  followers.map((user: FollowerPreview) => (
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
                      This universe seems quiet… for now 🌌
                    </p>
                  </div>
                )}
              </div>
            </ModalBody>

            {/* <ModalFooter>
              <Button variant="light" onPress={onClose}>
                Close
              </Button>
            </ModalFooter> */}
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
