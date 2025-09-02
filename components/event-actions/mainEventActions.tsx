import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Calendar,
} from "@heroui/react";
import {
  AdjustmentsHorizontalIcon,
  ArchiveBoxXMarkIcon,
  BanknotesIcon,
  BellIcon,
  BellSlashIcon,
  CalendarIcon,
  ChatBubbleBottomCenterIcon,
  ChatBubbleBottomCenterTextIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentListIcon,
  CogIcon,
  FlagIcon,
  GlobeAmericasIcon,
  PlayIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import Lottie from "lottie-react";
import settings from "@/public/lottie/settings.json";
import { useToast } from "@/app/providers/ToastProvider";
import { useEffect, useState } from "react";
import { ManageOrbiter } from "../host-action-modals/manageOrbiters";
import {
  dropDownStyle,
  secondaryDescriptionStyle,
} from "@/utils/get-dropdown-style/getDropDownStyle";
import { EditEventModal } from "./editEventModal";

type EventAction = {
  isHost: boolean;
  isJoined: boolean;
  eventId: string;
  hostId: string;
  userId: string;
  eventIsPublic: boolean;
  handleDelete: () => void;
  handleCancel: () => void;
  handleLeave: () => void;
  handleJoin: () => void;
};

type EventActionsProps = EventAction & {
  eventStatus: string;
};

export function EventActions({
  isHost,
  isJoined,
  eventId,
  hostId,
  eventIsPublic,
  handleDelete, //TODO: leave for admin application!
  handleCancel,
  handleLeave,
  handleJoin,
  eventStatus,
}: EventActionsProps) {
  const { notify } = useToast();
  const actionsAfterEventClose =
    eventStatus === "canceled" || eventStatus === "completed";

  useEffect(() => {
    if (actionsAfterEventClose && !isHost && isJoined) {
      handleLeave();
    }
  }, [actionsAfterEventClose]);

  console.log(`Event Id from actions: ${eventId}`);

  const [manageOrbiterModalOpen, setManageOrbiterModalOpen] = useState(false);
  const [editEventModalOpen, setEditEventModalOpen] = useState(false);

  return (
    <>
      <Dropdown backdrop="blur" classNames={dropDownStyle}>
        <DropdownTrigger>
          <Button
            isIconOnly
            variant="light"
            className="!p-0 !m-0 mt-1 min-w-0 h-auto w-auto text-gray-400 hover:text-primary"
          >
            <Lottie
              animationData={settings}
              style={{
                width: "2.1rem",
                padding: 0,
                marginLeft: "-5px",
                marginTop: "2px",
              }}
            />
          </Button>
        </DropdownTrigger>

        <DropdownMenu aria-label="Event Actions" variant="light">
          {isHost ? (
            <>
              <DropdownItem
                key="edit"
                classNames={secondaryDescriptionStyle}
                description={`Update and notify your Orbiters`}
                className="text-concrete"
                endContent={<CogIcon className="text-xs w-7" />}
                onPress={() => setEditEventModalOpen(true)}
              >
                Event Settings
              </DropdownItem>
              {!actionsAfterEventClose && (
                <DropdownItem
                  key="manage_orbiters"
                  className="text-concrete"
                  classNames={secondaryDescriptionStyle}
                  endContent={
                    <ClipboardDocumentListIcon className="text-xs w-7 mb-1.5" />
                  }
                  description={`Promote, Check-in, or Restrict Users`}
                  onPress={
                    /* TODO: get attendee list. */ () =>
                      setManageOrbiterModalOpen(true)
                  }
                >
                  Manage Orbiters
                </DropdownItem>
              )}
              {!actionsAfterEventClose && (
                <DropdownItem
                  key="cancel"
                  className="text-danger"
                  endContent={<TrashIcon className="text-xs w-5" />}
                  color="danger"
                  onPress={handleCancel}
                >
                  {"Cancel Event"}
                </DropdownItem>
              )}
            </>
          ) : (
            <>
              {isJoined ? (
                <DropdownItem
                  key="leave"
                  className="text-danger"
                  endContent={<BellSlashIcon className="text-xs w-5" />}
                  color="secondary"
                  onPress={handleLeave}
                >
                  Leave Event
                </DropdownItem>
              ) : (
                !actionsAfterEventClose && (
                  <DropdownItem
                    key="join"
                    className="text-concrete"
                    endContent={<BellIcon className="text-xs w-5" />}
                    onPress={handleJoin}
                  >
                    Join Event
                  </DropdownItem>
                )
              )}
              {!actionsAfterEventClose && (
                <DropdownItem
                  key="orbit"
                  className="text-concrete"
                  endContent={<GlobeAmericasIcon className="text-xs w-5" />}
                  onPress={() =>
                    notify(
                      "Unable to Orbit 😭",
                      "Sit tight! this feature is coming soon 🤞"
                    )
                  }
                >
                  Orbit Event
                </DropdownItem>
              )}
              {!isHost && (
                <>
                  <DropdownItem
                    key="message_host"
                    className="text-concrete"
                    endContent={
                      <ChatBubbleBottomCenterIcon className="text-xs w-5" />
                    }
                    onPress={
                      /* TODO: add message function */ () =>
                        console.log(`Messaging Host function here`)
                    }
                  >
                    Message Host
                  </DropdownItem>

                  {!actionsAfterEventClose && (
                    <>
                      <DropdownItem
                        key="add_to_calendar"
                        className="text-concrete"
                        endContent={<CalendarIcon className="text-xs w-5" />}
                        onPress={
                          /*TODO: SCRUM-48*/ () =>
                            console.log(`TODO: add calendar API endpoint`)
                        }
                      >
                        Add to Calendar
                      </DropdownItem>
                      {isJoined && (
                        <DropdownItem
                          key="check_in"
                          className="text-concrete"
                          endContent={
                            <ClipboardDocumentCheckIcon className="text-xs w-5" />
                          }
                          onPress={
                            /*TODO: check in function */ () =>
                              console.log(`TODO: add check-in API endpoint`)
                          }
                        >
                          Check In
                        </DropdownItem>
                      )}
                    </>
                  )}
                  <DropdownItem
                    key="report"
                    className="text-concrete"
                    endContent={<FlagIcon className="text-xs w-5" />}
                    onPress={
                      /* TODO: add report function */ () =>
                        console.log(`Report event here`)
                    }
                  >
                    Report Event
                  </DropdownItem>
                </>
              )}
            </>
          )}
        </DropdownMenu>
      </Dropdown>
      <ManageOrbiter
        isOpen={manageOrbiterModalOpen}
        onClose={() => setManageOrbiterModalOpen(false)}
        eventIsPublic={eventIsPublic}
        eventId={eventId}
        hostId={hostId}
      />
      <EditEventModal
        isOpen={editEventModalOpen}
        onClose={() => setEditEventModalOpen(false)}
        eventId={eventId}
      />
    </>
  );
}
