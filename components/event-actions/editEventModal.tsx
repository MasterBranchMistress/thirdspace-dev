"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  Input,
  Textarea,
  Button,
  Spinner,
  Chip,
  DatePicker,
} from "@heroui/react";
import { EventBudget, EventDoc } from "@/lib/models/Event";
import { useToast } from "@/app/providers/ToastProvider";
import Image from "next/image";
import logo from "@/public/third-space-logos/thirdspace-logo-5.png";
import { ZonedDateTime, parseAbsoluteToLocal } from "@internationalized/date";
import {
  attachmentStyling,
  calendarStyling,
  inputStyling,
} from "@/utils/get-dropdown-style/getDropDownStyle";
import { parseZonedDate } from "@/utils/date-handling/parseCalendarZoneDateTime";
import { RecurrenceRule, SelectRecurringEvent } from "./selectRecurringEvent";
import { SelectEventPrivacy } from "./selectEventPrivacy";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";
import BudgetInput from "../budget-handling/budgetSlider";
import Lottie from "lottie-react";
import hourglass from "@/public/lottie/hourglass.json";
import AttachmentUploader from "../attachment-uploader/attachmentUploader";
import LocationSearch from "../location-auto-complete/searchInput";
import { useFeed } from "@/app/context/UserFeedContext";
import DurationPicker from "../event-duration/eventDuration";
import { getDurationInMinutes } from "@/utils/metadata/get-event-duration/eventDuration";

type EditEventModalProps = {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  initialData?: Partial<EventDoc>; // optional, to prefill if parent passes data
};

export function EditEventModal({
  isOpen,
  onClose,
  eventId,
  initialData,
}: EditEventModalProps) {
  const { notify } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<ZonedDateTime | null>(null);
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [location, setLocation] = useState<{
    name: string;
    lat?: number;
    lng?: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("active");
  const [recurring, setRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule>("");
  const [isPublic, setIsPublic] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const { data: session } = useSession();
  const [costInfo, setCostInfo] = useState<EventBudget | null>(null);
  const feed = useFeed();

  const user = session?.user;

  const durationMinutes = getDurationInMinutes(startTime ?? "", endTime);

  const isPreset = [15, 30, 45, 60, 120, 180, 300, 480].includes(
    durationMinutes ?? 30,
  );
  const durationKey = isPreset ? String(durationMinutes) : "custom";

  const hasValidUser = !!user;
  const hasValidTitle = !!title?.trim();
  const hasValidDescription = !!description?.trim();
  const hasValidDate = !!date;
  const hasValidStartTime =
    !!startTime?.trim() && /^\d{2}:\d{2}$/.test(startTime);
  const hasValidTags = Array.isArray(tags) && tags.length > 0;
  const hasValidLocation = !!location?.name?.trim();

  const hasValidFiles =
    !newFiles?.some((f) => f.size > 50 * 1024 * 1024) &&
    !newFiles?.some((f) => !f.type);

  const hasValidCost =
    costInfo !== null &&
    !!costInfo.splitMode &&
    !Number.isNaN(Number(costInfo.totalEstimated)) &&
    Number(costInfo.totalEstimated) >= 0;

  function resetErrors() {
    !hasValidTitle ? setTitle("") : null;
    !hasValidDescription ? setDescription("") : null;
    !hasValidDate ? setDate(null) : null;
    !hasValidStartTime ? setStartTime("") : null;
    !hasValidTags ? setTags([]) : null;
    !hasValidLocation ? setLocation(null) : null;
    !hasValidCost ? setCostInfo(null) : null;
    !hasValidFiles ? setNewFiles([]) : null;
  }

  const canSubmit =
    !loading &&
    hasValidUser &&
    hasValidTitle &&
    hasValidDescription &&
    hasValidDate &&
    hasValidStartTime &&
    hasValidTags;

  // Prefill on open
  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setTitle(initialData.title || "");
      setDescription(initialData.description || "");
      if (initialData.date) {
        const isoString =
          initialData.date instanceof Date
            ? initialData.date.toISOString()
            : initialData.date;
        setDate(parseAbsoluteToLocal(isoString));
        setEventDate(isoString);
      }
      setStartTime(initialData.startTime || "");
      setEndTime(initialData.endTime || "");
      setTags(initialData.tags || []);
      setLocation({
        name: initialData.location?.name ?? "",
        lat: initialData.location?.lat,
        lng: initialData.location?.lng,
      });
      setAttachments(
        (initialData.attachments ?? []).map((a: any) =>
          typeof a === "string" ? a : a.url,
        ),
      );
      setStatus(initialData.status ?? "active");
      setCostInfo({
        totalEstimated: initialData.costInfo?.totalEstimated ?? 0,
        splitMode: initialData.costInfo?.splitMode ?? "free",
        currency: "USD",
      });
      setIsPublic(initialData.public ?? false);
    } else {
      (async () => {
        try {
          setLoading(true);
          const res = await fetch(`/api/events/${eventId}`);
          if (!res.ok) throw new Error("Failed to fetch event");
          const data: EventDoc = await res.json();
          setTitle(data.title);
          setDescription(data.description);
          if (data.date) {
            setDate(parseAbsoluteToLocal(String(data.date)));
            setEventDate(String(data.date));
          }
          setStartTime(String(data.startTime));
          setEndTime(String(data.endTime));
          setTags(Array.isArray(data.tags) ? data.tags.map(String) : []);
          setLocation({
            name: data.location?.name ?? "",
            lat: data.location?.lat,
            lng: data.location?.lng,
          });
          setAttachments(
            (data.attachments ?? []).map((a: any) =>
              typeof a === "string" ? a : a.url,
            ),
          );
          setCostInfo({
            totalEstimated: data.costInfo?.totalEstimated ?? 0,
            splitMode: data.costInfo?.splitMode ?? "free",
            currency: "USD",
          });
          setIsPublic(data.public ?? false);
        } catch (err) {
          notify("Couldn't load event 😭", (err as Error).message);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [isOpen, eventId, initialData]);

  const handleSave = async () => {
    try {
      setLoading(true);
      let uploadedUrls: string[] = [];

      const MAX_TOTAL_BYTES = 50 * 1024 * 1024; // 50MB total payload guard

      const totalBytes = newFiles.reduce((sum, f) => sum + (f?.size ?? 0), 0);

      if (totalBytes > MAX_TOTAL_BYTES) {
        const mb = (n: number) => (n / (1024 * 1024)).toFixed(1);
        onClose();
        resetErrors();
        return notify(
          "Attachments are too large.",
          `Total is ${mb(totalBytes)}MB. Max total is ${mb(MAX_TOTAL_BYTES)}MB.`,
        );
      }

      if (!hasValidCost) {
        onClose();
        resetErrors();
        return notify(
          "Estimated cost is required.",
          "All fields must be set for cost info.",
        );
      }

      if (newFiles.length > 0) {
        const res = await fetch(`/api/events/${eventId}/upload-attachments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            files: newFiles.map((f) => ({
              fileName: f.name,
              fileType: f.type,
            })),
          }),
        });

        const { files: presigned } = await res.json();

        await Promise.all(
          newFiles.map((file, i) =>
            fetch(presigned[i].signedUrl, {
              method: "PUT",
              body: file,
              headers: { "Content-Type": file.type },
            }),
          ),
        );

        uploadedUrls = presigned.map((f: any) => f.publicUrl);
      }

      let isoDate: string | null = null;
      let time: string | null = null;

      if (date) {
        isoDate = date.toAbsoluteString();
        const jsDate = date.toDate();
        time = jsDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
      }

      const res = await fetch(`/api/events/${eventId}/update-event`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hostId: session?.user?.id,
          updates: {
            title,
            description,
            status,
            date: isoDate,
            startTime: time ?? startTime,
            endTime: endTime,
            public: isPublic,
            recurring,
            recurrenceRule,
            tags,
            location,
            attachments: [...attachments, ...uploadedUrls],
            costInfo: costInfo,
          },
        }),
      });

      if (!res.ok) {
        resetErrors();
        onClose();
        const errData = await res.json().catch(() => ({}));
        notify("Something went wrong here 🤔", errData.error);
        throw new Error(errData.error || "Failed to update event");
      }

      onClose();
      notify("Event Edited 🗓️", "Your event was updated successfully.");
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      notify("Couldn't save changes 😭", (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      placement="center"
      size="xs"
      scrollBehavior="inside"
      backdrop="blur"
      isDismissable={false}
      hideCloseButton={false}
      className="bg-transparent text-concrete h-auto overflow-y-auto"
      classNames={{ closeButton: "text-concrete" }}
    >
      <ModalContent className="p-6 space-y-4 text-concrete">
        {loading ? (
          <div className="flex flex-col justify-center items-center py-6">
            <Lottie animationData={hourglass} style={{ width: "12rem" }} />
            <h1>Updating your event. One moment!</h1>
          </div>
        ) : (
          <>
            <Image
              src={logo}
              width={600}
              alt="thirdspace-logo-white"
              className="justify-center p-0"
              style={{ marginTop: "-7rem" }}
            ></Image>
            <div className="mt-[-7rem] z-10 flex flex-col space-y-6">
              <Input
                isRequired
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                variant="underlined"
              />
              <Textarea
                isRequired
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                variant="underlined"
              />
              <>
                <DatePicker
                  label="Date"
                  classNames={calendarStyling}
                  labelPlacement="outside"
                  selectorButtonPlacement="end"
                  size="sm"
                  isRequired
                  value={date}
                  onChange={(val) => {
                    setDate(val); // keep ZonedDateTime in state
                    if (val) {
                      const { isoDate, startTime } = parseZonedDate(val);
                      setEventDate(String(isoDate));
                      setStartTime(startTime);
                    }
                  }}
                  variant="underlined"
                />
                {date && (
                  <DurationPicker
                    duration={durationKey}
                    eventDate={eventDate}
                    onChange={(val) => {
                      console.log(val, typeof val);
                      setEndTime(val);
                    }}
                  />
                )}
              </>
              {/* TODO: decide if we even need this. Status can be time based. recurrance seems awfully spammy. implement later maybe */}
              <BudgetInput
                initialValue={costInfo?.totalEstimated ?? 0}
                initialSplitMode={costInfo?.splitMode ?? "free"}
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
              <LocationSearch
                value={location?.name ?? ""}
                onChange={(val) =>
                  setLocation((prev) => ({
                    name: val,
                    lat: prev?.lat,
                    lng: prev?.lng,
                  }))
                }
                onSelect={(loc) => setLocation(loc)}
              />
              <Input
                label="Event Tags (5 max)"
                value={tagInput}
                classNames={inputStyling}
                className="border-b-2 border-secondary"
                onChange={(e: any) => setTagInput(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === "Enter") {
                    e.preventDefault();

                    if (tags.length >= 5) return;

                    const value = tagInput.trim().toLowerCase();
                    if (!value) return;

                    if (!tags.includes(value)) {
                      setTags((prev) => [...prev, value]);
                    }

                    setTagInput(""); // clear input after adding
                  }
                  if (e.key === "Backspace" && !tagInput && tags.length > 0) {
                    setTags((prev) => prev.slice(0, -1));
                  }
                }}
              />
              <p className="text-xs text-center justify-center text-white/50 mt-1">
                {tagInput
                  ? "Press Enter to add tag"
                  : tags.length > 0
                    ? "Backspace to remove last tag"
                    : "Press Enter to add tags"}
              </p>

              <div className="flex flex-wrap justify-center gap-2">
                {tags.map((t, i) => (
                  <Chip key={`${t}-${i}`} size="sm" color="primary">
                    #{t}
                  </Chip>
                ))}
              </div>
              <AttachmentUploader
                onFilesSelected={(files) =>
                  setNewFiles((prev) => [...prev, ...files])
                }
              />
              {attachments.length > 0 && (
                <h1 className="text-center font-extralight mt-3">
                  Existing Attachments
                </h1>
              )}
              {attachments.length > 0 && (
                <div className="flex flex-wrap w-full h-auto justify-center gap-1">
                  {attachments.map((url, i) => (
                    <div key={i} className="relative group">
                      {url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                        <img
                          src={url}
                          alt={`Attachment ${i}`}
                          className={attachmentStyling}
                        />
                      ) : url.match(/\.(mp4|mov|avi|webm)$/i) ? (
                        <video
                          src={url}
                          className={attachmentStyling}
                          controls
                        />
                      ) : (
                        <p className="text-xs text-secondary">
                          Unsupported file
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setAttachments((prev) =>
                            prev.filter((_, idx) => idx !== i),
                          )
                        }
                        className="absolute top-3 right-3 bg-white/20 text-white rounded-full border-1 border-concrete p-0.5 shadow"
                      >
                        <XMarkIcon width={12} height={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-center gap-3 mt-3">
                <Button
                  color="primary"
                  variant="shadow"
                  size="sm"
                  onPress={handleSave}
                  isLoading={loading}
                  isDisabled={loading || !canSubmit}
                >
                  Save
                </Button>
                <Button
                  variant="ghost"
                  color="secondary"
                  size="sm"
                  onPress={onClose}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
