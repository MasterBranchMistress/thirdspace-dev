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
  CogIcon,
  EllipsisVerticalIcon,
  FlagIcon,
  MegaphoneIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { CommentDoc } from "@/lib/models/Comment";
import { dropDownStyle } from "@/utils/get-dropdown-style/getDropDownStyle";

type Props = {
  onEdit?: () => void;
  onDelete?: () => void;
  onReport?: () => void;
  comment: CommentDoc;
  isHost: boolean;
  isCommentOwner: boolean;
  isCommentPinned: boolean;
};

export default function CommentActions({
  onEdit,
  onDelete,
  onReport,
  comment,
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
        {isHost ? (
          <DropdownItem
            key="pin"
            className="text-concrete"
            endContent={<MegaphoneIcon width={21} />}
          >
            {isCommentPinned ? "Unpin" : "Pin"}
          </DropdownItem>
        ) : null}
        {isCommentOwner ? (
          <DropdownItem
            key="edit"
            className="text-concrete"
            onPress={onEdit}
            endContent={<CogIcon width={21} />}
          >
            Edit
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
            className="text-danger"
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
