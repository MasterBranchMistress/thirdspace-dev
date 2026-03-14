import { Attachment } from "@/types/user-feed";
import detectMediaType from "../detect-media-type/detectMediaType";

export function normalizeAttachments(
  attachments?: (string | Attachment)[],
): Attachment[] {
  if (!Array.isArray(attachments)) return [];

  return attachments.flatMap((attachment) => {
    if (typeof attachment === "string") {
      const mediaType = detectMediaType(attachment);
      return [{ url: attachment, type: mediaType }];
    }

    if (attachment && typeof attachment.url === "string") {
      return [{ url: attachment.url, type: attachment.type }];
    }

    return [];
  });
}
