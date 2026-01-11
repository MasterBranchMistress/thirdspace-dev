"use client";

import { useState } from "react";
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
import AddEventModal from "../event-actions/addEventModal";

export default function Footer() {
  const [openModal, setOpenModal] = useState<"status" | "event" | null>(null);

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
        </DropdownMenu>
      </Dropdown>

      <AddStatus
        isOpen={openModal === "status"}
        onOpenChange={(open: boolean) => {
          // keep explicit: if modal says it's closed, clear state
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
