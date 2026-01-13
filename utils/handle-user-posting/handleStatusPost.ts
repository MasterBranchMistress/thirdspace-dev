import { SessionUser } from "@/types/user-session";
import { uploadFilesViaPresign } from "../amazon-s3-media/returns3Urls";

type Props = {
  loggedInUser: SessionUser;
  content: string;
  attachments: File[];
};

export async function handleAddStatus({
  loggedInUser,
  content,
  attachments,
}: Props) {
  try {
    const uploadedUrls = await uploadFilesViaPresign({
      presignEndpoint: `/api/users/${loggedInUser.id}/upload-status-attachments`,
      files: attachments,
      log: (msg, meta) => console.log(msg, meta), // or omit in prod
    });

    const res = await fetch(`/api/users/${loggedInUser.id}/post-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: content,
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
