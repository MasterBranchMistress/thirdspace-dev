import { SessionUser } from "@/types/user-session";
import { ZonedDateTime } from "@heroui/system/dist/types";
import { useState } from "react";
import { uploadFilesViaPresign } from "../amazon-s3-media/returns3Urls";

type Props = {
  loggedInUser: SessionUser;
  eventTitle: string;
  eventDesc: string;
  eventTimeAndDate: string;
  eventStartTime: string;
  eventTags: string[];
  estimatedCost: number;
  eventLocation: string;
  eventPrivacy: boolean;
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
  estimatedCost,
  attachments,
}: Props) {
  try {
    console.log("event creation started", {
      userId: loggedInUser.id,
      title: eventTitle,
    });
    const uploadedUrls = await uploadFilesViaPresign({
      presignEndpoint: `/api/users/${loggedInUser.id}/upload-status-attachments`,
      files: attachments,
      log: (msg, meta) => console.log(msg, meta), // or omit in prod
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
          tags: eventTags,
          public: eventPrivacy,
          reccuuring: false,
          budgetInfo: {
            estimatedCost: estimatedCost,
            currency: "usd",
            notes: null,
          },
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
