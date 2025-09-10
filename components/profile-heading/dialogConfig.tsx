import { UserDoc } from "@/lib/models/User";

export type DialogConfig = {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  danger?: boolean;
};

export function getBlockDialogConfig(
  isBlocked: boolean,
  user: UserDoc
): DialogConfig {
  if (isBlocked) {
    return {
      title: `Unblock @${user.username}?`,
      description: `${user.firstName} ${user.lastName} will be able to see your profile activity. Continue?`,
      confirmLabel: "Unblock",
      cancelLabel: "Cancel",
      danger: false,
    };
  }
  return {
    title: `Block @${user.username}?`,
    description: `${user.firstName} ${user.lastName} will not be able to see your profile activity. Continue?`,
    confirmLabel: "Block",
    cancelLabel: "Cancel",
    danger: true,
  };
}

export function getUnfriendDialogConfig(user: UserDoc): DialogConfig {
  return {
    title: `Unfriend @${user.username}?`,
    description: `${user.firstName} ${user.lastName} will no longer be in your Orbit, but will still be able to see your group activity. Continue?`,
    confirmLabel: "Unfriend",
    cancelLabel: "Cancel",
    danger: true,
  };
}
