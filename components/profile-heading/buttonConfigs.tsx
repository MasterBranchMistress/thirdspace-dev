import {
  PencilSquareIcon,
  UserMinusIcon,
  ChatBubbleLeftEllipsisIcon,
  UserPlusIcon,
  GlobeAmericasIcon,
  RocketLaunchIcon,
  UserGroupIcon,
  NoSymbolIcon,
  HandRaisedIcon,
} from "@heroicons/react/24/outline";

type BooleanSwitches = {
  isSelf: boolean;
  isFriend: boolean;
  isPendingOutgoing: boolean;
  isPendingIncoming: boolean;
  isFollowing: boolean;
  isBlocked: boolean;
};

export function getUserActionConfig({
  isSelf,
  isFriend,
  isPendingOutgoing,
  isPendingIncoming,
}: BooleanSwitches) {
  if (isSelf)
    return {
      label: "Edit Profile",
      icon: <PencilSquareIcon width={17} className="shrink-0" />,
    };
  if (isFriend)
    return {
      label: "Unfriend",
      icon: <UserMinusIcon width={17} className="shrink-0" />,
    };
  if (isPendingOutgoing)
    return {
      label: "Cancel",
      icon: <UserMinusIcon width={17} className="shrink-0" />,
    };
  if (isPendingIncoming)
    return {
      label: "Respond",
      icon: <ChatBubbleLeftEllipsisIcon width={17} className="shrink-0" />,
    };
  return {
    label: "Add Friend",
    icon: <UserPlusIcon width={17} className="shrink-0" />,
  };
}

export function getSecondaryActionConfig({
  isSelf,
  isFollowing,
}: BooleanSwitches) {
  if (isSelf)
    return {
      label: "Explore",
      icon: <GlobeAmericasIcon width={17} className="shrink-0" />,
    };
  if (isFollowing)
    return {
      label: "Unfollow",
      icon: <UserMinusIcon width={17} className="shrink-0" />,
    };
  return {
    label: "Follow",
    icon: <RocketLaunchIcon width={17} className="shrink-0" />,
  };
}

export function getManageActionConfig({ isSelf, isBlocked }: BooleanSwitches) {
  if (isSelf)
    return {
      label: "Friend List",
      icon: <UserGroupIcon width={17} className="shrink-0" />,
    };
  if (isBlocked)
    return {
      label: "Blocked",
      icon: <NoSymbolIcon width={17} className="shrink-0" />,
    };
  return {
    label: "Block User",
    icon: <HandRaisedIcon width={17} className="shrink-0" />,
  };
}
