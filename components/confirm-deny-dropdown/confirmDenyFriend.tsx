import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
} from "@heroui/react";
import {
  ChatBubbleLeftEllipsisIcon,
  UserMinusIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";
import { dropDownStyle } from "@/utils/get-dropdown-style/getDropDownStyle";
import { useNotifications } from "@/app/context/NotificationContext";
import { useUserRelationships } from "@/app/context/UserRelationshipsContext";

export function RespondDropdown({
  onAccept,
  onReject,
  disabled,
}: {
  onAccept: () => void;
  onReject: () => void;
  disabled?: boolean;
}) {
  return (
    <Dropdown classNames={dropDownStyle} backdrop="blur">
      <DropdownTrigger>
        <Button
          className="text-tiny tracking-tighter text-white bg-black/20 border-white/20 border-1"
          radius="lg"
          size="sm"
          variant="flat"
          disabled={disabled}
        >
          <ChatBubbleLeftEllipsisIcon width={17} className="shrink-0 mr-1" />
          Respond
        </Button>
      </DropdownTrigger>
      <DropdownMenu aria-label="Respond to friend request">
        <DropdownItem
          key="accept"
          startContent={<UserPlusIcon width={16} />}
          onClick={onAccept}
        >
          Accept
        </DropdownItem>
        <DropdownItem
          key="reject"
          startContent={<UserMinusIcon width={16} />}
          className="text-danger"
          onClick={onReject}
        >
          Reject
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}
