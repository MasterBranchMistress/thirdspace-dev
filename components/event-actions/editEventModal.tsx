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
import { EventDoc } from "@/lib/models/Event";
import { useToast } from "@/app/providers/ToastProvider";
import Image from "next/image";
import logo from "@/public/third-space-logos/thirdspace-logo-5.png";
import { ZonedDateTime, parseAbsoluteToLocal } from "@internationalized/date";
import {
  attachmentStyling,
  calendarStyling,
} from "@/utils/get-dropdown-style/getDropDownStyle";
import { parseZonedDate } from "@/utils/date-handling/parseCalendarZoneDateTime";
import { RecurrenceRule, SelectRecurringEvent } from "./selectRecurringEvent";
import { SelectEventPrivacy } from "./selectEventPrivacy";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";
import LocationAutocomplete from "../location-auto-complete/locationAutocomplete";
import BudgetInput from "../budget-handling/budgetSlider";
import Lottie from "lottie-react";
import hourglass from "@/public/lottie/hourglass.json";
import AttachmentUploader from "../attachment-uploader/attachmentUploader";

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
  const [budget, setBudget] = useState<number>(0);

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
      }
      setStartTime(initialData.startTime || "");
      setTags(initialData.tags || []);
      setLocation({
        name: initialData.location?.name ?? "",
        lat: initialData.location?.lat,
        lng: initialData.location?.lng,
      });
      setAttachments(
        (initialData.attachments ?? []).map((a: any) =>
          typeof a === "string" ? a : a.url
        )
      );
      setStatus(initialData.status ?? "active");
      setBudget(initialData?.budgetInfo?.estimatedCost ?? 0);
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
          }
          setStartTime(String(data.startTime));
          setTags(Array.isArray(data.tags) ? data.tags.map(String) : []);
          setLocation({
            name: data.location?.name ?? "",
            lat: data.location?.lat,
            lng: data.location?.lng,
          });
          setAttachments(
            (data.attachments ?? []).map((a: any) =>
              typeof a === "string" ? a : a.url
            )
          );
          setBudget(data.budgetInfo?.estimatedCost ?? 0);
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

      //If we have files uploaded
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

        //Upload to S3
        await Promise.all(
          newFiles.map((file, i) =>
            fetch(presigned[i].signedUrl, {
              method: "PUT",
              body: file,
              headers: { "Content-Type": file.type },
            })
          )
        );

        uploadedUrls = presigned.map((f: any) => f.publicUrl);
      }
      //for our date
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
            date: eventDate,
            startTime,
            public: isPublic,
            recurring,
            recurrenceRule,
            tags,
            location,
            attachments: [...attachments, ...uploadedUrls],
            budgetInfo: {
              estimatedCost: budget,
              currency: "USD",
            },
          },
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to update event");
      }
      notify("Event updated ✅", "Your changes were saved successfully!");
      onClose();
      setTimeout(() => {
        window.location.reload();
      }, 3000);
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
              <DatePicker
                label="Date"
                classNames={calendarStyling}
                labelPlacement="outside"
                selectorButtonPlacement="end"
                size="sm"
                isRequired
                value={date}
                onChange={(val) => {
                  console.log("datepicker val:", val);
                  setDate(val); // keep ZonedDateTime in state
                  if (val) {
                    const { isoDate, time } = parseZonedDate(val);
                    setEventDate(String(isoDate));
                    setStartTime(time);
                  }
                }}
                variant="underlined"
              />
              {/* TODO: decide if we even need this. Status can be time based. recurrance seems awfully spammy. implement later maybe */}
              {/* <EventStatusSelect status={status} setStatus={setStatus} />
              <SelectRecurringEvent
                recurring={recurring}
                recurrenceRule={recurrenceRule}
                setRecurring={setRecurring}
                setRecurrenceRule={setRecurrenceRule}
              /> */}
              <SelectEventPrivacy
                isPublic={isPublic}
                setIsPublic={setIsPublic}
              />
              <LocationAutocomplete
                value={location?.name ?? ""}
                onChange={(val) => setLocation({ ...location, name: val })}
                onSelect={(loc) => setLocation(loc)}
              />
              <BudgetInput initialValue={budget} onChange={setBudget} />
              <Input
                label="Tags (comma separated)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onBlur={() => {
                  const parsed = tagInput
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean);
                  setTags(parsed);
                  setTagInput(parsed.join(", ")); // normalize view
                }}
                classNames={{ label: "text-concrete" }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const parsed = tagInput
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean);
                    setTags(parsed);
                    setTagInput(parsed.join(", "));
                  }
                }}
                variant="underlined"
              />
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, i) => (
                  <Chip key={i} size="sm" color="primary">
                    #{tag}
                  </Chip>
                ))}
              </div>
              <AttachmentUploader
                onFilesSelected={(files) =>
                  setNewFiles((prev) => [...prev, ...files])
                }
              />
              <h1 className="text-center font-extralight mt-3">
                Existing Attachments
              </h1>
              {attachments.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1">
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
                            prev.filter((_, idx) => idx !== i)
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
                  disabled={loading}
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
