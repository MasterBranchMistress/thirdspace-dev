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
import { useEffect } from "react";

type EventAction = {
  isHost: boolean;
  isJoined: boolean;
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
  handleDelete,
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
  }, [eventStatus]);

  return (
    <Dropdown
      backdrop="blur"
      classNames={{
        base: "before:bg-default-200",

        content:
          "p-0 border-small border-white/20 bg-white/10 dark:bg-black/20 backdrop-blur-xl shadow-lg rounded-xl",
      }}
    >
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
              className="text-concrete"
              endContent={<CogIcon className="text-xs w-5" />}
              onPress={
                /* TODO: edit event function */ () =>
                  console.log(`edit event function here`)
              }
            >
              Event Settings
            </DropdownItem>
            {!actionsAfterEventClose && (
              <DropdownItem
                key="manage_orbiters"
                className="text-concrete"
                endContent={
                  <ClipboardDocumentListIcon className="text-xs w-5" />
                }
                onPress={
                  /* TODO: get attendee list. */ () =>
                    console.log(`edit event function here`)
                }
              >
                Manage Orbiters
              </DropdownItem>
            )}
            {!actionsAfterEventClose && (
              <DropdownItem
                key="start_event"
                className="text- bg-green-800"
                endContent={<PlayIcon className="text-xs w-5" />}
                onPress={
                  /* TODO: set event to in-progress, automatic check-in. users checked in get karma points */ () =>
                    console.log(`start event function here`)
                }
              >
                Start Event
              </DropdownItem>
            )}
            <DropdownItem
              key="cancel"
              className="text-concrete bg-danger"
              endContent={
                actionsAfterEventClose ? (
                  <TrashIcon className="text-xs w-5" />
                ) : (
                  <ArchiveBoxXMarkIcon className="text-xs w-5" />
                )
              }
              color="danger"
              onPress={actionsAfterEventClose ? handleDelete : handleCancel}
            >
              {actionsAfterEventClose ? "Delete Event" : "Cancel Event"}
            </DropdownItem>
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
                  className="text-secondary bg-danger"
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
  );
}
