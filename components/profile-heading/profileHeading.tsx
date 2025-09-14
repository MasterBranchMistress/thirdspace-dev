"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardFooter,
  Image,
  Button,
  CardHeader,
  Chip,
} from "@heroui/react";
import { UserDoc } from "@/lib/models/User";
import { ChatBubbleLeftRightIcon, FireIcon } from "@heroicons/react/24/outline";
import { sendFriendRequest } from "@/utils/user-relationship-handlling/sendFriendRequest";
import { SessionUser } from "@/types/user-session";
import {
  RelationshipFlags,
  useUserRelationships,
} from "@/app/context/UserRelationshipsContext";
import { useNotifications } from "@/app/context/NotificationContext";
import { useToast } from "@/app/providers/ToastProvider";
import { RespondDropdown } from "../confirm-deny-dropdown/confirmDenyFriend";
import { unfriend } from "@/utils/user-relationship-handlling/handleUnfriend";
import confetti from "canvas-confetti";
import { blockUser } from "@/utils/user-relationship-handlling/blockUser";
import ConfirmDialog from "../confirm-delete/confirmDialog";
import { unblockUser } from "@/utils/user-relationship-handlling/unblockUser";
import { handleFollowUser } from "@/utils/user-relationship-handlling/followUnfollowUser";
import {
  getUserActionConfig,
  getSecondaryActionConfig,
  getManageActionConfig,
} from "./buttonConfigs";
import {
  DialogConfig,
  getBlockDialogConfig,
  getUnfriendDialogConfig,
} from "./dialogConfig";
import ProfileSettingsModal from "../profile-settings/profileSettings";

export default function ProfileHeading({
  disabled,
  //The profile we're veiwing
  user,
  relationship,
  isSelf,
  viewer,
}: {
  disabled?: boolean;
  user: UserDoc;
  viewer: SessionUser;
  relationship: RelationshipFlags;
  isSelf: boolean;
}) {
  const [showOverlay, setShowOverlay] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<DialogConfig | null>(null);
  const [dialogAction, setDialogAction] = useState<() => Promise<void>>(
    async () => {}
  );
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const { setRelationship, getRelationship } = useUserRelationships();

  const flags = getRelationship(String(user._id));

  const isFriend = !!flags.friend;
  const isBlocked = !!flags.blocked;
  const isPendingIncoming = !!flags.pendingIncoming;
  const isPendingOutgoing = !!flags.pendingOutgoing;
  const isFollowing = !!flags.following;

  const { reject, cancel, accept } = useNotifications();

  const { notify } = useToast();

  const [userActionFunction, setUserActionFunction] = useState<
    () => Promise<void>
  >(async () => {});
  const [manageActionFunction, setManageActionFunction] = useState<
    () => Promise<void>
  >(async () => {});
  const [manageStatusFunction, setManageStatusFunction] = useState<
    () => Promise<void>
  >(async () => {});
  const [secondaryActionFunction, setSecondaryActionFunction] = useState<
    () => Promise<void>
  >(async () => {});

  const statuses = {
    isSelf: isSelf,
    isFriend: isFriend,
    isPendingIncoming: isPendingIncoming,
    isPendingOutgoing: isPendingOutgoing,
    isFollowing: isFollowing,
    isBlocked: isBlocked,
  };
  const { label: userActionLabel, icon: userActionIcon } =
    getUserActionConfig(statuses);
  const { label: secondaryActionLabel, icon: secondaryActionIcon } =
    getSecondaryActionConfig(statuses);
  const { label: manageActionLabel, icon: manageActionIcon } =
    getManageActionConfig(statuses);

  useEffect(() => {
    if (isSelf) {
      setUserActionFunction(() => async () => {
        setIsEditingProfile(true);
      });
      setSecondaryActionFunction(() => async () => {
        notify("Explore coming soon 🤝", "");
      });
    } else if (isFriend) {
      setManageStatusFunction(() => async () => {
        await unfriend({ loggedInUser: viewer, userToUnfriend: user });
        setRelationship(String(user._id), { friend: false });
        notify(`Unfriended ${user.username} 🙅`, ``);
      });
    } else if (isPendingOutgoing) {
      setUserActionFunction(() => async () => {
        await cancel(viewer.id);
        setRelationship(String(user._id), {});
        notify("Friend request canceled! 🤝", ``);
      });
    } else if (isPendingIncoming) {
      // Respond handled via dropdown
      setUserActionFunction(() => async () => {});
    } else {
      setUserActionFunction(() => async () => {
        await sendFriendRequest(viewer, user);
        setRelationship(String(user._id), { pendingOutgoing: true });
        notify("Friend request sent! 🚀", ``);
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      });
    }

    if (isBlocked) {
      setManageActionFunction(() => async () => {
        await unblockUser({ loggedInUser: viewer, userToUnblock: user });
        setRelationship(String(user._id), {});
        notify(`Unblocked ${user.username} 👩‍🚀`, ``);
      });
    } else {
      setManageActionFunction(() => async () => {
        await blockUser({ loggedInUser: viewer, userToBlock: user });
        setRelationship(String(user._id), { blocked: true });
        notify(`Blocked ${user.username} 🙅`, ``);
      });
    }
    if (!isSelf) {
      if (!isFollowing) {
        setSecondaryActionFunction(() => async () => {
          await handleFollowUser({ userWereFollowing: user });
          setRelationship(String(user._id), {
            ...(isFriend ? { friend: true } : {}),
            following: true,
          });
        });
      } else {
        setSecondaryActionFunction(() => async () => {
          await handleFollowUser({ userWereFollowing: user });
          setRelationship(String(user._id), { following: false });
          notify(`Following ${user.firstName} ${user.lastName} 👍`, ``);
          confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
        });
      }
    }
  }, [
    relationship,
    isSelf,
    isFriend,
    isBlocked,
    isFollowing,
    isPendingIncoming,
    isPendingOutgoing,
  ]);

  return (
    <>
      <Card
        isFooterBlurred
        className="border-none relative shadow-2xl overflow-hidden"
        radius="none"
      >
        {/* Overlayed header */}
        <CardHeader
          className="absolute top-0 z-20
        flex flex-col items-start
        w-full px-3 py-2
        bg-gradient-to-b from-black/60 to-transparent"
        >
          <div className="flex flex-row justify-between w-full">
            <div className="flex flex-col">
              <h1 className="text-sm font-light tracking-tight text-white">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-white text-xs font-extralight tracking-tight">
                @{user.username}
              </p>
            </div>
            <div>
              <button
                className={`hover:cursor-pointer ${isSelf ? "hidden" : ""}`}
              >
                <ChatBubbleLeftRightIcon className="h-6 w-6 shrink-0 text-white" />
              </button>
            </div>
          </div>
        </CardHeader>

        {/* Background image */}
        <Image
          alt={`${user.firstName} Profile photo`}
          className="object-cover z-0 h-64"
          height={300}
          radius="none"
          src={user.avatar}
          width={500}
        />

        {/* Transparent button overlay */}
        <button
          onClick={() => setShowOverlay(!showOverlay)}
          className="absolute inset-0 z-10 bg-transparent cursor-pointer"
          aria-label="Show bio and tags"
          disabled={disabled}
        />

        {/* Overlay content */}
        {showOverlay && (
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm z-30 
            flex flex-col justify-center items-center p-4 text-center space-y-3 animate-fade-in"
            onClick={() => setShowOverlay(false)}
          >
            <p className="text-sm font-light mb-6 text-white italic">
              {user.bio || "No bio provided."}
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {user.tags?.map((tag) => (
                <Chip key={tag} color="primary" variant="shadow" size="sm">
                  #{tag}
                </Chip>
              ))}
            </div>
          </div>
        )}

        {/* Footer buttons */}
        <CardFooter
          className={`justify-between backdrop-blur-xl before:bg-white/10 border-t-1 border-white/30
        overflow-hidden py-1.5 absolute rounded-none bottom-[-8] 
        shadow-small z-20 mb-2`}
        >
          {!isPendingIncoming ? (
            <Button
              className={`text-tiny ${isFriend || isPendingOutgoing ? "text-danger" : "text-concrete"} tracking-tighter bg-black/20 border-white/20 border-1`}
              color="danger"
              radius="lg"
              size="sm"
              variant="flat"
              disabled={disabled}
              onPress={
                !isFriend
                  ? userActionFunction
                  : () => {
                      setDialogConfig(getUnfriendDialogConfig(user));
                      setDialogAction(() => manageStatusFunction);
                    }
              }
            >
              {userActionIcon}
              {userActionLabel}
            </Button>
          ) : (
            <RespondDropdown
              onAccept={async () => {
                await accept(String(user._id));
                confetti({
                  particleCount: 100,
                  spread: 80,
                  origin: { y: 0.6 },
                });
                setRelationship(viewer.id, { friend: true });
                setRelationship(String(user._id), { friend: true });
                notify(
                  "Friend request Accepted! 🤝",
                  `${user.firstName} has been notified. Send a quick message!`
                );
                confetti({
                  particleCount: 100,
                  spread: 80,
                  origin: { y: 0.6 },
                });
              }}
              onReject={async () => {
                await reject(String(user._id));
                setRelationship(viewer.id, { friend: false });
                setRelationship(String(user._id), { friend: false });
                notify(
                  "Friend request Rejected! ❌",
                  `${user.firstName} will not be notified of this.`
                );
              }}
            ></RespondDropdown>
          )}
          <Button
            className={`text-tiny tracking-tighter ${!isFollowing ? `text-concrete` : `text-danger`} bg-black/20 border-white/20 border-1`}
            color="default"
            radius="lg"
            size="sm"
            variant="flat"
            spinner="dot"
            disabled={disabled}
            onPress={secondaryActionFunction}
          >
            {secondaryActionIcon}
            {secondaryActionLabel}
          </Button>
          <Button
            className="text-tiny text-white tracking-tighter bg-black/20 border-white/20 border-1 "
            color="default"
            radius="lg"
            size="sm"
            variant="flat"
            onPress={() => {
              notify("Feature Coming Soon! 🤝", ``);
            }}
          >
            <FireIcon width={17} className="shrink-0" /> Spark
          </Button>
          <Button
            className={`text-tiny  ${isBlocked ? `text-concrete bg-danger` : `${!isSelf ? `text-danger` : "text-concrete"} bg-black/20 border-white/20`} tracking-tighter border-1`}
            color="danger"
            radius="lg"
            size="sm"
            variant="flat"
            disabled={disabled}
            onPress={() => {
              setDialogConfig(getBlockDialogConfig(isBlocked, user));
              setDialogAction(() => manageActionFunction);
            }}
          >
            {manageActionIcon}
            {manageActionLabel}
          </Button>
        </CardFooter>
      </Card>

      {dialogConfig && (
        <ConfirmDialog
          isOpen={!!dialogConfig}
          onOpenChange={(open) => !open && setDialogConfig(null)}
          title={dialogConfig.title}
          description={dialogConfig.description}
          confirmLabel={dialogConfig.confirmLabel}
          cancelLabel={dialogConfig.cancelLabel}
          danger={dialogConfig.danger}
          onConfirm={dialogAction}
        />
      )}
      <ProfileSettingsModal
        isOpen={isEditingProfile}
        onOpenChange={setIsEditingProfile}
      />
    </>
  );
}
