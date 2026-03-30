import { SessionUser } from "@/types/user-session";
import { ZonedDateTime } from "@heroui/system/dist/types";
import { useState } from "react";
import { uploadFilesViaPresign } from "../amazon-s3-media/returns3Urls";
import { EventBudget } from "@/lib/models/Event";

type Props = {
  loggedInUser: SessionUser;
  eventTitle: string;
  eventDesc: string;
  eventTimeAndDate: string;
  eventStartTime: string;
  eventEndTime: string;
  eventTags: string[];
  estimatedCost: number;
  eventLocation: string;
  eventPrivacy: boolean;
  costInfo: EventBudget;
  attachments: File[];
};

export async function handleAddEvent({
  loggedInUser,
  eventTitle,
  eventDesc,
  eventLocation,
  eventPrivacy,
  eventTags,
  eventTimeAndDate,
  eventStartTime,
  eventEndTime,
  costInfo,
  attachments,
}: Props) {
  try {
    const uploadedUrls = await uploadFilesViaPresign({
      presignEndpoint: `/api/users/${loggedInUser.id}/upload-status-attachments`,
      files: attachments,
    });
    const res = await fetch(`/api/events/${loggedInUser.id}/add-event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: {
          title: eventTitle,
          description: eventDesc,
          date: eventTimeAndDate,
          startTime: eventStartTime,
          endTime: eventEndTime,
          tags: eventTags,
          public: eventPrivacy,
          reccuuring: false,
          costInfo: costInfo,
          location: {
            name: eventLocation,
          },
        },
        attachments: uploadedUrls,
      }),
    });
    if (!res.ok) {
      throw new Error(`Failed with status ${res.status}`);
    }
    return res.json();
  } catch (err) {
    console.error("Error posting status:", err);
    throw new Error(err as any);
  }
}
