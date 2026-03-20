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
import { useFeed } from "@/app/context/UserFeedContext";
import LocationSearch from "../location-auto-complete/searchInput";
import { CostSplitMode, EventBudget, EventDoc } from "@/lib/models/Event";

type AddEventProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function AddEventModal({ isOpen, onOpenChange }: AddEventProps) {
  const { data: session, update } = useSession();
  const { notify } = useToast();
  const user = session?.user;
  const feed = useFeed();
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
  const [costInfo, setCostInfo] = useState<{
    totalEstimated: number;
    splitMode: CostSplitMode;
    currency: "USD";
  } | null>(null);
  const [splitMode, setSplitMode] = useState<CostSplitMode>("free");
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
    setCostInfo(null);
    setSplitMode("free");
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
      costInfo: costInfo,
    };

    const MAX_TOTAL_BYTES = 50 * 1024 * 1024; // 50MB total payload guard
    const MAX_FILE_BYTES = 50 * 1024 * 1024; // optional per-file guard (keep or change)

    const totalBytes = newFiles.reduce((sum, f) => sum + (f?.size ?? 0), 0);

    if (totalBytes > MAX_TOTAL_BYTES) {
      const mb = (n: number) => (n / (1024 * 1024)).toFixed(1);
      return notify(
        "Attachments are too large.",
        `Total is ${mb(totalBytes)}MB. Max total is ${mb(MAX_TOTAL_BYTES)}MB.`,
      );
    }

    if (newFiles.some((f) => f.size > MAX_FILE_BYTES)) {
      const mb = (n: number) => (n / (1024 * 1024)).toFixed(1);
      return notify(
        "One attachment is too large.",
        `Max per file is ${mb(MAX_FILE_BYTES)}MB.`,
      );
    }

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

    //TODO: Decide how big is too big later. 10mb was just being a pain
    if (newFiles?.some((f) => f.size > 50 * 1024 * 1024))
      return notify("One or more attachments exceed 50MB.", "");
    if (newFiles?.some((f) => !f.type))
      return notify(
        "One or more attachments have an unsupported file type.",
        "",
      );
    if (eventData.costInfo == null)
      return notify("Estimated cost is required.", "");
    if (Number.isNaN(Number(eventData.costInfo.totalEstimated)))
      return notify("Estimated cost must be a number.", "");
    if (Number(eventData.costInfo.totalEstimated) < 0)
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
        estimatedCost: eventData.costInfo.totalEstimated,
        eventPrivacy: eventData.public,
        costInfo: eventData.costInfo,
        attachments: newFiles,
      });
      try {
        notify("Event created 🗓️", "Sit tight while your event is processed.");
        // confetti and gentle UX after success
        const confettiModule = (await import("canvas-confetti")).default;
        confettiModule({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        feed.refresh?.();
      } catch (err) {
        notify("Whoops, something went wrong here!", "");
        console.error(err);
      }

      resetForm();
      // close modal
      onOpenChange(false);
      // optional: reload to show event in feed
      //TODO: use websocket to update
      // setTimeout(() => window.location.reload(), 800);
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
                      }}
                    />
                  </div>
                  <Input
                    label="Tags (comma separated)"
                    value={tagInput}
                    classNames={inputStyling}
                    className="border-b-2 border-secondary"
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

                  <LocationSearch
                    value={location?.name ?? ""}
                    onChange={(val) =>
                      setLocation({
                        ...(location ?? { name: "" }),
                        name: val,
                      })
                    }
                    onSelect={(loc) => setLocation(loc)}
                  />

                  <BudgetInput
                    initialValue={costInfo?.totalEstimated ?? 0}
                    onChange={(val) => {
                      setCostInfo((prev) => ({
                        ...(prev ?? {
                          splitMode: "free",
                          totalEstimated: 0,
                          currency: "USD",
                        }),
                        totalEstimated: val,
                      }));
                    }}
                    onSplitChange={(mode) => {
                      setCostInfo((prev) => ({
                        ...(prev ?? { totalEstimated: 0, currency: "USD" }),
                        splitMode: mode,
                      }));
                    }}
                  />

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

                <ModalFooter className="flex justify-center gap-2 p-4">
                  <Button
                    type="button"
                    variant="ghost"
                    color="secondary"
                    onPress={() => {
                      resetForm();
                      onOpenChange(false);
                    }}
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    color="primary"
                    variant="shadow"
                    isLoading={loading}
                    size="sm"
                  >
                    Add Event
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
