// components/comments/CommentActions.tsx
"use client";

import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Button,
} from "@heroui/react";
import {
  BellAlertIcon,
  BellSlashIcon,
  CogIcon,
  EllipsisVerticalIcon,
  FlagIcon,
  MegaphoneIcon,
  NoSymbolIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { CommentDoc } from "@/lib/models/Comment";
import { dropDownStyle } from "@/utils/get-dropdown-style/getDropDownStyle";
import { useState } from "react";

type Props = {
  onEdit?: () => void;
  onDelete?: () => void;
  onReport?: () => void;
  onPressEdit: () => void;
  onPressCancelEdit: () => void;
  onPin: () => void;
  editing: boolean;
  comment: CommentDoc;
  isHost: boolean;
  isCommentOwner: boolean;
  isCommentPinned: boolean;
};

export default function CommentActions({
  onDelete,
  onReport,
  onPressEdit,
  onPressCancelEdit,
  onPin,
  editing,
  isHost,
  isCommentOwner,
  isCommentPinned,
}: Props) {
  return (
    <Dropdown placement="right" classNames={dropDownStyle} backdrop="blur">
      <DropdownTrigger>
        <Button
          isIconOnly
          variant="light"
          radius="full"
          className="text-concrete"
        >
          <EllipsisVerticalIcon width={21} className="text-primary" />
        </Button>
      </DropdownTrigger>
      <DropdownMenu aria-label="Comment actions">
        {isCommentOwner ? (
          <DropdownItem
            key="edit"
            className={editing ? "text-danger" : "text-concrete"}
            onPress={editing ? onPressCancelEdit : onPressEdit}
            endContent={
              editing ? (
                <NoSymbolIcon width={21} />
              ) : (
                <PencilSquareIcon width={21} />
              )
            }
          >
            {editing ? "Cancel" : "Edit"}
          </DropdownItem>
        ) : null}
        {isHost ? (
          <DropdownItem
            key="pin"
            className={isCommentPinned ? "text-danger" : "text-concrete"}
            onPress={onPin}
            endContent={
              isCommentPinned ? (
                <BellSlashIcon width={21} />
              ) : (
                <BellAlertIcon width={21} />
              )
            }
          >
            {isCommentPinned ? "Unpin" : "Pin"}
          </DropdownItem>
        ) : null}
        {!isCommentOwner ? (
          <DropdownItem
            key="report"
            className="text-danger"
            onPress={onReport}
            endContent={<FlagIcon width={21} />}
          >
            Report
          </DropdownItem>
        ) : null}
        {isHost || isCommentOwner ? (
          <DropdownItem
            key="delete"
            className="text-concrete bg-danger"
            onPress={onDelete}
            endContent={<TrashIcon width={21} />}
          >
            Delete
          </DropdownItem>
        ) : null}
      </DropdownMenu>
    </Dropdown>
  );
}
