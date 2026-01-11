import { SessionUser } from "@/types/user-session";

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
    let uploadedUrls: string[] = [];
    //TODO: remove console log
    console.log("handleAddStatus called", {
      userId: loggedInUser.id,
      attachmentsCount: attachments?.length ?? 0,
    });

    if (attachments) {
      const uploadedRes = await fetch(
        `/api/users/${loggedInUser.id}/upload-status-attachments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            files: attachments.map((f) => ({
              fileName: f.name,
              fileType: f.type,
            })),
          }),
        }
      );

      if (!uploadedRes.ok) {
        throw new Error(
          `Attachment upload failed: ${uploadedRes.status} ${uploadedRes.body}`
        );
      }
      const { files: presigned } = await uploadedRes.json();

      //Upload to S3
      await Promise.all(
        attachments.map((file, i) =>
          fetch(presigned[i].signedUrl, {
            method: "PUT",
            body: file,
            headers: { "Content-Type": file.type },
          })
        )
      );

      uploadedUrls = presigned.map((f: any) => f.publicUrl);
    }

    console.log("Calling /post-status once", {
      uploadedUrlsLength: uploadedUrls.length,
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
