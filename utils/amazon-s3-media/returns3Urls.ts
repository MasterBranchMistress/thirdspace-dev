type PresignedFile = {
  signedUrl: string;
  publicUrl: string;
};

type GetPresignedResponse = {
  files: PresignedFile[];
};

type UploadFilesOptions = {
  /**
   * Endpoint that returns presigned upload URLs.
   * Example: `/api/users/${userId}/upload-status-attachments`
   */
  presignEndpoint: string;

  /** Files selected by the user */
  files?: File[] | null;

  /** Optional abort support */
  signal?: AbortSignal;

  /** Optional logger (defaults to no-op) */
  log?: (msg: string, meta?: any) => void;
};

export async function uploadFilesViaPresign({
  presignEndpoint,
  files,
  signal,
  log = () => {},
}: UploadFilesOptions): Promise<string[]> {
  const attachments = files ?? [];
  if (attachments.length === 0) return [];

  log("Requesting presigned URLs", {
    presignEndpoint,
    count: attachments.length,
  });

  const presignRes = await fetch(presignEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify({
      files: attachments.map((f) => ({
        fileName: f.name,
        fileType: f.type || "application/octet-stream",
      })),
    }),
  });

  if (!presignRes.ok) {
    const text = await safeReadText(presignRes);
    throw new Error(
      `Presign failed: ${presignRes.status} ${presignRes.statusText}${text ? ` - ${text}` : ""}`
    );
  }

  const data = (await presignRes.json()) as GetPresignedResponse;

  if (!data?.files?.length || data.files.length !== attachments.length) {
    throw new Error(
      `Presign returned mismatched file count. expected=${attachments.length} got=${data?.files?.length ?? 0}`
    );
  }

  log("Uploading to S3", { count: attachments.length });

  // Upload all files; fail if any upload fails.
  const uploadResults = await Promise.all(
    attachments.map(async (file, i) => {
      const { signedUrl } = data.files[i];
      const putRes = await fetch(signedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "application/octet-stream" },
        signal,
      });

      if (!putRes.ok) {
        const text = await safeReadText(putRes);
        throw new Error(
          `S3 PUT failed for "${file.name}": ${putRes.status} ${putRes.statusText}${text ? ` - ${text}` : ""}`
        );
      }

      return true;
    })
  );

  // just to prevent unused warnings / for future metrics
  void uploadResults;

  const publicUrls = data.files.map((f) => f.publicUrl);
  log("Upload complete", { uploaded: publicUrls.length });

  return publicUrls;
}

async function safeReadText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}
