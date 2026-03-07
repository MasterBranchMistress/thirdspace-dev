"use client";

import { useEffect, useState } from "react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import Lottie from "lottie-react";
import addPost from "@/public/lottie/add-event.json";
import {
  PencilIcon,
  CalendarDaysIcon,
  QuestionMarkCircleIcon,
  LightBulbIcon,
} from "@heroicons/react/24/outline";
import AddStatus from "../add-post-handling/add-status-modal";
import AddEventModal from "../event-actions/addEventModal";
import { UserDoc } from "@/lib/models/User";
import { getUser } from "@/utils/frontend-backend-connection/getUserInfo";
import { useSession } from "next-auth/react";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";

export default function Footer() {
  const { data: userSession } = useSession();
  const [openModal, setOpenModal] = useState<"status" | "event" | null>(null);
  const [tutorialText, setTutorialText] = useState(true);

  useEffect(() => {
    const hidden = localStorage.getItem("hideAddPostTutorial");
    if (hidden === "true") {
      setTutorialText(false);
    }
  }, []);

  if (!userSession) return null;

  return (
    <div className="fixed bottom-1.5 left-1.5 z-50">
      <Dropdown backdrop="blur">
        <DropdownTrigger>
          <button
            className="
              relative
              rounded-full
              flex
              items-center
              justify-center
              bg-white/20
              backdrop-blur-xl
              border border-white/30
              shadow-lg
              hover:scale-105
              transition-transform
              animate-postGlow
            "
            onClick={() => {
              setTutorialText(false);
              localStorage.setItem("hideAddPostTutorial", "true");
            }}
          >
            <span className="absolute inset-0 rounded-full blur-md bg-primary animate-postPulse"></span>
            <span className="relative flex items-center justify-center">
              <Lottie
                animationData={addPost}
                loop
                autoplay
                style={{ height: "30px", width: "30px" }}
              />
            </span>

            {tutorialText ? (
              <div className="flex felx-row gap-2 pr-2 pl-2 animate-blink font-extrabold">
                <ArrowLeftIcon width={20} color="secondary" /> Click This Button
                To Add A Post
              </div>
            ) : null}
          </button>
        </DropdownTrigger>

        <DropdownMenu
          aria-label="Add something"
          onAction={(key) => {
            if (key === "add-status") setOpenModal("status");
            if (key === "add-event") setOpenModal("event");
          }}
        >
          <DropdownItem key="add-status" endContent={<PencilIcon width={16} />}>
            Add Status
          </DropdownItem>

          <DropdownItem
            key="add-event"
            endContent={<CalendarDaysIcon width={16} />}
          >
            Add Event
          </DropdownItem>
          <DropdownItem
            key="show-tutorial"
            onPress={() => {
              localStorage.removeItem("hideAddPostTutorial");
            }}
            endContent={<LightBulbIcon width={16} />}
          >
            Show Tips
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>

      <AddStatus
        isOpen={openModal === "status"}
        onOpenChange={(open: boolean) => {
          if (!open) setOpenModal(null);
          else setOpenModal("status");
        }}
      />

      <AddEventModal
        isOpen={openModal === "event"}
        onOpenChange={(open: boolean) => {
          if (!open) setOpenModal(null);
          else setOpenModal("event");
        }}
      />
    </div>
  );
}
