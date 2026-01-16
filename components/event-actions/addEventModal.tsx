"use client";

import { useEffect, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Chip,
  DatePicker,
  TimeInput,
  TimeInputValue,
} from "@heroui/react";
import AttachmentUploader from "../attachment-uploader/attachmentUploader";
import { useSession } from "next-auth/react";
import { useToast } from "@/app/providers/ToastProvider";
import Image from "next/image";
import logo from "@/public/third-space-logos/thirdspace-logo-5.png";
import Lottie from "lottie-react";
import hourglass from "@/public/lottie/hourglass.json";
import LocationAutocomplete from "../location-auto-complete/locationAutocomplete";
import BudgetInput from "../budget-handling/budgetSlider";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { SelectEventPrivacy } from "./selectEventPrivacy";
import {
  calendarStyling,
  inputStyling,
} from "@/utils/get-dropdown-style/getDropDownStyle";
import {
  getLocalTimeZone,
  now,
  parseAbsoluteToLocal,
  Time,
  ZonedDateTime,
} from "@internationalized/date";
import React from "react";
import { parseZonedDate } from "@/utils/date-handling/parseCalendarZoneDateTime";
import { handleAddEvent } from "@/utils/handle-user-posting/handleEventPost";

type AddEventProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function AddEventModal({ isOpen, onOpenChange }: AddEventProps) {
  const { data: session } = useSession();
  const { notify } = useToast();
  const user = session?.user;
  // let [value, setValue] = React.useState(
  //   parseAbsoluteToLocal("2024-04-08T18:45:22Z")
  // );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<ZonedDateTime | null>(null);
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [location, setLocation] = useState<{
    name: string;
    lat?: number;
    lng?: number;
  } | null>(null);
  const [budget, setBudget] = useState<number>(0);
  const [isPublic, setIsPublic] = useState<boolean>(false);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      // reset only when modal closes (optional)
      // keep as no-op so you don't lose draft accidentally — comment this out if you want a clean slate every open
      // resetForm();
    }
  }, [isOpen]);

  function resetForm() {
    setTitle("");
    setDescription("");
    setEventDate("");
    setStartTime("");
    setTagInput("");
    setTags([]);
    setLocation(null);
    setBudget(0);
    setDate(null);
    setIsPublic(false);
    setNewFiles([]);
  }

  const normalizeTags = (raw: string) =>
    raw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 10);

  const submit = async (e?: React.FormEvent) => {
    // const idempotencyKey = makeIdempotencyKey();

    const eventData = {
      title: title.trim(),
      description: description.trim(),
      date: eventDate,
      startTime: startTime,
      tags,
      public: isPublic,
      recurring: false,
      recurrenceRule: null,
      location: location,
      budgetInfo: { estimatedCost: budget },
    };

    //error handling....
    if (e) e.preventDefault();
    if (!date) return console.log("Date is required!", "");
    if (!startTime?.trim()) return console.log("Start time is required!", "");
    if (!user) return notify("You must be signed in to create an event!", "");
    if (loading) return;

    if (!title?.trim()) return notify("Event title is required.", "");
    if (!description?.trim())
      return notify("Event description is required.", "");
    if (!date) return notify("Date is required.", "");

    if (!startTime?.trim()) return notify("Start time is required.", "");
    if (!/^\d{2}:\d{2}$/.test(startTime))
      return notify("Start time must be in HH:mm format.", "");

    if (!Array.isArray(tags) || tags.length === 0)
      return notify("Add at least one tag.", "");

    if (!location?.name?.trim()) return notify("Location is required.", "");

    if (newFiles?.some((f) => f.size > 10 * 1024 * 1024))
      return notify("One or more attachments exceed 10MB.", "");
    if (newFiles?.some((f) => !f.type))
      return notify(
        "One or more attachments have an unsupported file type.",
        ""
      );
    if (eventData.budgetInfo.estimatedCost == null)
      return notify("Estimated cost is required.", "");
    if (Number.isNaN(Number(eventData.budgetInfo.estimatedCost)))
      return notify("Estimated cost must be a number.", "");
    if (Number(eventData.budgetInfo.estimatedCost) < 0)
      return notify("Estimated cost can't be negative.", "");

    setLoading(true);

    try {
      setLoading(true);
      await handleAddEvent({
        loggedInUser: user,
        eventTitle: eventData.title,
        eventDesc: eventData.description,
        eventTags: eventData.tags,
        eventTimeAndDate: eventData.date,
        eventLocation: eventData.location?.name as any,
        eventStartTime: eventData.startTime,
        estimatedCost: eventData.budgetInfo.estimatedCost,
        eventPrivacy: eventData.public,
        attachments: newFiles,
      });
      notify("Event created", "Your event is live!");
      // confetti and gentle UX after success
      try {
        const confettiModule = (await import("canvas-confetti")).default;
        confettiModule({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch (err) {
        notify("Whoops, something went wrong here!", "");
        console.error(err);
      }

      resetForm();
      // close modal
      onOpenChange(false);
      // optional: reload to show event in feed
      //TODO: use websocket to update
      setTimeout(() => window.location.reload(), 800);
    } catch (err: any) {
      console.error("Create event error", err);
      notify("Something went wrong here!", "Unable to create event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="xs"
      placement="center"
      backdrop="blur"
      scrollBehavior="inside"
      isDismissable={false}
      hideCloseButton={false}
      classNames={{
        closeButton: "text-concrete",
      }}
      className="bg-transparent text-concrete h-auto overflow-y-auto"
    >
      <ModalContent className="p-6 space-y-4 text-concrete">
        {(onClose) => (
          <>
            {loading ? (
              <div className="flex flex-col justify-center items-center py-6">
                <Lottie animationData={hourglass} style={{ width: "12rem" }} />
                <h1>Creating event... one sec!</h1>
              </div>
            ) : (
              <form onSubmit={submit}>
                <Image
                  src={logo}
                  width={600}
                  alt="thirdspace-logo-white"
                  className="justify-center p-0"
                  style={{ marginTop: "-7rem", marginBottom: "-6rem" }}
                ></Image>

                <div className="z-10 flex flex-col space-y-6">
                  <Input
                    label="Event Title"
                    value={title}
                    onChange={(e: any) => setTitle(e.target.value)}
                    variant="underlined"
                    classNames={inputStyling}
                    isRequired
                  />
                  <Textarea
                    label="Event Description"
                    variant="underlined"
                    value={description}
                    onChange={(e: any) => setDescription(e.target.value)}
                    classNames={inputStyling}
                    rows={4}
                    isRequired
                  />
                  <div className="w-full max-w-xl flex flex-row gap-4">
                    <DatePicker
                      hideTimeZone
                      isRequired
                      classNames={calendarStyling}
                      defaultValue={now(getLocalTimeZone())}
                      label="Event Date"
                      variant="underlined"
                      onChange={(val) => {
                        // keep ZonedDateTime in state
                        const { isoDate, time } = parseZonedDate(val);
                        setDate(val);
                        setEventDate(String(isoDate));
                        setStartTime(time);
                        console.log(
                          "datepicker val:",
                          "Event date: ",
                          eventDate,
                          "event time: ",
                          startTime
                        );
                      }}
                    />
                  </div>
                  <Input
                    label="Tags (comma separated)"
                    value={tagInput}
                    classNames={inputStyling}
                    onChange={(e: any) => setTagInput(e.target.value)}
                    onBlur={() => {
                      const parsed = normalizeTags(tagInput);
                      setTags(parsed);
                      setTagInput(parsed.join(", "));
                    }}
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const parsed = normalizeTags(tagInput);
                        setTags(parsed);
                        setTagInput(parsed.join(", "));
                      }
                    }}
                    isRequired
                  />

                  <div className="flex flex-wrap gap-2">
                    {tags.map((t, i) => (
                      <Chip key={i} size="sm" color="primary">
                        #{t}
                      </Chip>
                    ))}
                  </div>

                  <LocationAutocomplete
                    value={location?.name ?? ""}
                    onChange={(val) =>
                      setLocation({
                        ...(location ?? { name: "" }),
                        name: val,
                      })
                    }
                    onSelect={(loc) => setLocation(loc)}
                  />

                  <BudgetInput initialValue={budget} onChange={setBudget} />

                  <SelectEventPrivacy
                    isPublic={isPublic}
                    setIsPublic={setIsPublic}
                  />

                  <AttachmentUploader
                    onFilesSelected={(files) =>
                      setNewFiles((prev) => [...prev, ...files])
                    }
                  />
                </div>

                <ModalFooter className="flex justify-end gap-2 p-4">
                  <Button
                    type="button"
                    variant="ghost"
                    color="secondary"
                    onPress={() => {
                      resetForm();
                      onOpenChange(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    color="primary"
                    variant="shadow"
                    isLoading={loading}
                  >
                    Create Event
                  </Button>
                </ModalFooter>
              </form>
            )}
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
