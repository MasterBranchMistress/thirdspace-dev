"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  Card,
  CardFooter,
  Image,
  Button,
  CardHeader,
  Chip,
} from "@heroui/react";
import { UserDoc } from "@/lib/models/User";
import {
  ChatBubbleLeftEllipsisIcon,
  ChatBubbleLeftRightIcon,
  FireIcon,
  GlobeAmericasIcon,
  HandRaisedIcon,
  NoSymbolIcon,
  PencilSquareIcon,
  RocketLaunchIcon,
  UserGroupIcon,
  UserMinusIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";
import { sendFriendRequest } from "@/utils/user-relationship-handlling/sendFriendRequest";
import { SessionUser } from "@/types/user-session";
import { useUserRelationships } from "@/app/context/UserRelationshipsContext";
import { useNotifications } from "@/app/context/NotificationContext";
import { useToast } from "@/app/providers/ToastProvider";
import { RespondDropdown } from "../confirm-deny-dropdown/confirmDenyFriend";
import { unfriend } from "@/utils/user-relationship-handlling/handleUnfriend";
import confetti from "canvas-confetti";
import { blockUser } from "@/utils/user-relationship-handlling/blockUser";
import ConfirmDialog from "../confirm-delete/confirmDialog";
import { unblockUser } from "@/utils/user-relationship-handlling/unblockUser";

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
  relationship: string;
  isSelf: boolean;
}) {
  const [showOverlay, setShowOverlay] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const isPendingIncoming = relationship === "pending_friend_request_incoming";
  const isPendingOutgoing = relationship === "pending_friend_request_outgoing";
  const isFriend = relationship === "friend";
  const isFollowing = relationship === "following";
  const isBlocked = relationship === "blocked";
  const { reject, cancel, accept } = useNotifications();
  const { setRelationship } = useUserRelationships();
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

  useEffect(() => {
    if (isSelf) {
      setUserActionFunction(() => async () => {
        //TODO: implement function edit profile. Open already made edit profile
        // open settings modal or navigate
      });
    } else if (isFriend) {
      setManageStatusFunction(() => async () => {
        //Unfreind
        unfriend({ loggedInUser: viewer, userToUnfriend: user });
        setRelationship(String(user._id), isFollowing ? "following" : "none");
        setRelationship(String(viewer.id), isFollowing ? "following" : "none");
        notify(
          `@${user.username} has been unfriended ❌`,
          `${user.firstName} will not be notified of your request`
        );
      });
    } else if (isPendingOutgoing) {
      setUserActionFunction(() => async () => {
        await cancel(viewer.id);
        setRelationship(String(user._id), "none");
        setRelationship(String(viewer.id), "none");
        notify(
          "Friend request canceled! ❌",
          `Your friend request to @${user.username} has been canceled.`
        );
      });
    } else if (isPendingIncoming) {
      setUserActionFunction(() => async () => {
        //made a seperate dropdown for this. done
        // open a modal with Accept / Reject options
      });
    } else {
      setUserActionFunction(() => async () => {
        await sendFriendRequest(viewer, user);
        setRelationship(viewer.id, "pending_friend_request_incoming");
        setRelationship(String(user._id), "pending_friend_request_outgoing");
        notify(
          "Friend request sent! 🤝",
          `${user.firstName} has been notified of your request.`
        );
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
        });
      });
    }
  }, [
    relationship,
    isSelf,
    isFriend,
    isPendingOutgoing,
    isPendingIncoming,
    viewer,
    user,
  ]);

  //block/unblock... last button
  useEffect(() => {
    console.log(`Is Blocked?: `, isBlocked);
    if (!isBlocked) {
      setManageActionFunction(() => async () => {
        try {
          blockUser({ loggedInUser: viewer, userToBlock: user });
          setRelationship(String(user._id), "blocked");
          notify(
            `${user.username} has been blocked! ❌`,
            `${user.firstName} ${user.lastName} will not be notified of your request.`
          );
        } catch (err) {
          throw new Error(err as string);
        }
      });
    }
    if (isBlocked) {
      setManageActionFunction(() => async () => {
        try {
          unblockUser({ loggedInUser: viewer, userToUnblock: user });
          setRelationship(String(user._id), "none");
          notify(
            `${user.username} has been unblocked! ✅`,
            `${user.firstName} ${user.lastName} will not be notified of your request.`
          );
        } catch (err) {
          throw new Error(err as string);
        }
      });
    }
  }, [relationship, isBlocked, viewer, user]);

  let userActionLabel = "Add Friend";
  let userActionIcon = <UserPlusIcon width={17} className="shrink-0" />;
  let secondaryActionLabel = "Follow";
  let secondaryActionIcon = (
    <RocketLaunchIcon width={17} className="shrink-0" />
  );
  let manageActionLabel = "Block User";
  let manageActionIcon = <HandRaisedIcon width={17} className="shrink-0" />;
  let dialogTitle;
  let dialogDesc;
  let confirmText;
  let denyText;
  let statusTitle;
  let statusDesc;
  let confirmStatus;
  let denyStatusText;

  if (isSelf) {
    userActionLabel = "Edit Profile";
    userActionIcon = <PencilSquareIcon width={17} className="shrink-0" />;
    secondaryActionLabel = "Explore";
    secondaryActionIcon = <GlobeAmericasIcon width={17} className="shrink-0" />;
    manageActionLabel = "Friend List";
    manageActionIcon = <UserGroupIcon width={17} className="shrink-0" />;
  } else if (isFriend) {
    userActionLabel = "Unfriend";
    userActionIcon = <UserMinusIcon width={17} />;
    if (isFollowing) {
      secondaryActionLabel = "Unfollow";
      secondaryActionIcon = <UserMinusIcon width={17} className="shrink-0" />;
    }
  } else if (isPendingOutgoing) {
    userActionLabel = "Cancel";
    userActionIcon = <UserMinusIcon width={17} className="shrink-0" />;
    if (isFollowing) {
      secondaryActionLabel = "Unfollow";
      secondaryActionIcon = <UserMinusIcon width={17} className="shrink-0" />;
    }
  }
  if (isPendingIncoming) {
    userActionLabel = "Respond";
    userActionIcon = (
      <ChatBubbleLeftEllipsisIcon width={17} className="shrink-0" />
    );
  }

  if (isBlocked) {
    manageActionLabel = "Blocked";
    manageActionIcon = <NoSymbolIcon width={17} className="shrink-0" />;
    dialogTitle = `Unblock @${user.username}?`;
    dialogDesc = `${user.firstName} ${user.lastName} will be able to see your profile activity. Continue?`;
    denyText = `Cancel`;
    confirmText = `Unblock`;
  }

  if (!isBlocked) {
    dialogTitle = `Block @${user.username}?`;
    dialogDesc = `${user.firstName} ${user.lastName} will not be able to see your profile activity. Continue?`;
    denyText = `Cancel`;
    confirmText = `Block`;
  }

  if (isFriend) {
    statusTitle = `Unfriend @${user.username}?`;
    statusDesc = `${user.firstName} ${user.lastName} will no longer be in your Orbit, but will still be able to see your group activity. Continue?`;
    denyStatusText = `Cancel`;
    confirmStatus = `Unfriend`;
  }

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
                !isFriend ? userActionFunction : () => setOpenStatusDialog(true)
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
                setRelationship(viewer.id, "friend");
                setRelationship(String(user._id), "friend");
                notify(
                  "Friend request Accepted! 🤝",
                  `${user.firstName} has been notified. Send a quick message!`
                );
              }}
              onReject={async () => {
                await reject(String(user._id));
                setRelationship(viewer.id, "none");
                setRelationship(String(user._id), "none");
                notify(
                  "Friend request Rejected! ❌",
                  `${user.firstName} will not be notified of this.`
                );
              }}
            ></RespondDropdown>
          )}
          <Button
            className="text-tiny tracking-tighter text-white bg-black/20 border-white/20 border-1 "
            color="default"
            radius="lg"
            size="sm"
            variant="flat"
            disabled={disabled}
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
            disabled={disabled}
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
            onPress={() => setOpenDialog(true)}
          >
            {manageActionIcon}
            {manageActionLabel}
          </Button>
        </CardFooter>
      </Card>

      <ConfirmDialog
        isOpen={openDialog}
        onOpenChange={setOpenDialog}
        title={dialogTitle}
        description={dialogDesc}
        confirmLabel={confirmText}
        cancelLabel={denyText}
        danger={!isBlocked}
        onConfirm={manageActionFunction}
      />
      <ConfirmDialog
        isOpen={openStatusDialog}
        onOpenChange={setOpenStatusDialog}
        title={statusTitle}
        description={statusDesc}
        confirmLabel={confirmStatus}
        cancelLabel={denyStatusText}
        danger={isFriend}
        onConfirm={manageStatusFunction}
      />
    </>
  );
}
