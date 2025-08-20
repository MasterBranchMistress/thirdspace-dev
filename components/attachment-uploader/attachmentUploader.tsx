"use client";

import { useState } from "react";
import { Button, Input } from "@heroui/react";

export default function FileUploader({
  onUploaded,
}: {
  onUploaded: (key: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setPreview(URL.createObjectURL(file));

    try {
      // 1. Request a signed URL from your backend
      const res = await fetch("/api/upload-attachments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: `attachments/${Date.now()}-${file.name}`, // prevent collisions
          fileType: file.type,
        }),
      });

      const { signedUrl, key } = await res.json();

      // 2. Upload file directly to S3
      await fetch(signedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      // 3. Pass the key up (so profile API can save it)
      onUploaded(key);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <Input type="file" accept="image/*,video/*" onChange={handleFileChange} />
      {uploading && <span className="text-sm">Uploading…</span>}
      {preview && (
        <img
          src={preview}
          alt="Preview"
          className="h-20 w-20 rounded-full object-cover"
        />
      )}
    </div>
  );
}
