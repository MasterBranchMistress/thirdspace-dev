"use client";

import { useDisclosure } from "@heroui/react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import Lottie from "lottie-react";
import addPost from "@/public/lottie/add-event.json";
import { PencilIcon, CalendarDaysIcon } from "@heroicons/react/24/outline";
import AddStatus from "../add-post-handling/add-status-modal";

export default function Footer() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  return (
    <div className="fixed bottom-1.5 left-1.5 z-50">
      <Dropdown backdrop="blur">
        <DropdownTrigger>
          <button className="rounded-full bg-white/20 backdrop-blur-xl border border-white/30 shadow-lg hover:scale-105 transition-transform">
            <Lottie
              animationData={addPost}
              loop
              autoplay
              style={{ height: "25px", width: "25px" }}
            />
          </button>
        </DropdownTrigger>
        <DropdownMenu
          aria-label="Add something"
          onAction={(key) => {
            if (key === "add-status") onOpen();
            if (key === "add-event") {
              // handle add-event flow
            }
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
        </DropdownMenu>
      </Dropdown>

      {/* Modal sits outside, controlled by disclosure */}
      <AddStatus isOpen={isOpen} onOpenChange={onOpenChange} />
    </div>
  );
}
